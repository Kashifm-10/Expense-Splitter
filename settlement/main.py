import os
from decimal import Decimal
from typing import List, Dict
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import jwt
from decouple import config

DJANGO_BASE_URL = config('DJANGO_BASE_URL', default='http://127.0.0.1:8000/api')
JWT_SECRET = config('JWT_SECRET_KEY')
JWT_ALGORITHM = config('JWT_ALGORITHM', default='HS256')

app = FastAPI(title="Settlement Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class SettlementTransaction(BaseModel):
    from_user: str
    to_user: str
    amount: float

class ExpenseDetail(BaseModel):
    id: int
    description: str
    amount: float
    paid_by: str
    created_at: str
    is_deleted: bool

class SettlementBreakdown(BaseModel):
    expenses: List[ExpenseDetail]
    balances: Dict[str, float]
    transactions: List[SettlementTransaction]

async def get_token(request: Request):
    auth = request.headers.get('Authorization')
    if not auth or not auth.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    return auth.split(' ')[1]

async def fetch_group_data(group_id: str, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        try:
            group_resp = await client.get(f"{DJANGO_BASE_URL}/groups/{group_id}/", headers=headers, timeout=10.0)
            if group_resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Group not found")
            if group_resp.status_code == 403:
                raise HTTPException(status_code=403, detail="You are not a member of this group")
            group_resp.raise_for_status()
            group_data = group_resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Django service is unavailable.")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Django service timed out.")

        try:
            expenses_resp = await client.get(f"{DJANGO_BASE_URL}/groups/{group_id}/expenses/", headers=headers, timeout=10.0)
            expenses_resp.raise_for_status()
            expenses_data = expenses_resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Django service is unavailable.")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Django service timed out.")

        return {"members": group_data["members"], "expenses": expenses_data}

def compute_net_balances(members, expenses):
    if not members:
        return {}
    active_expenses = [exp for exp in expenses if not exp.get('is_deleted', False)]
    if not active_expenses:
        return {m['username']: Decimal('0.00') for m in members}

    paid_cents = {m['username']: 0 for m in members}
    for exp in active_expenses:
        payer_email = exp['paid_by_email']
        amount_cents = int(round(float(exp['amount']) * 100))
        paid_cents[payer_email] += amount_cents

    total_cents = sum(paid_cents.values())
    n = len(members)
    base_share = total_cents // n
    remainder = total_cents - base_share * n

    balances = {}
    usernames = sorted(paid_cents.keys())
    for idx, username in enumerate(usernames):
        share = base_share + (1 if idx < remainder else 0)
        net_cents = paid_cents[username] - share
        balances[username] = Decimal(net_cents) / 100
    for uid in balances:
        balances[uid] = balances[uid].quantize(Decimal('0.01'))
    return balances

def settle_balances(balances, members):
    email_to_name = {m['username']: m['first_name'] for m in members}
    creditors = [(email, bal, email_to_name[email]) for email, bal in balances.items() if bal > 0]
    debtors = [(email, -bal, email_to_name[email]) for email, bal in balances.items() if bal < 0]
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)
    transactions = []
    i, j = 0, 0
    while i < len(creditors) and j < len(debtors):
        cred = creditors[i]; debt = debtors[j]
        settle_amount = min(cred[1], debt[1])
        if settle_amount > 0:
            transactions.append(SettlementTransaction(from_user=debt[2], to_user=cred[2], amount=float(settle_amount)))
        creditors[i] = (cred[0], cred[1] - settle_amount, cred[2])
        debtors[j] = (debt[0], debt[1] - settle_amount, debt[2])
        if creditors[i][1] == 0: i += 1
        if debtors[j][1] == 0: j += 1
    return transactions

@app.get("/settle/{group_id}", response_model=SettlementBreakdown)
async def settle_group(group_id: str, token: str = Depends(get_token)):
    try:
        jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        data = await fetch_group_data(group_id, token)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error while fetching data.")

    members = data['members']
    expenses_data = data['expenses']
    if not members:
        return SettlementBreakdown(expenses=[], balances={}, transactions=[])

    expenses_detail = [ExpenseDetail(
        id=exp['id'], description=exp['description'],
        amount=float(exp['amount']), paid_by=exp['paid_by_name'],
        created_at=exp['created_at'], is_deleted=exp.get('is_deleted', False)
    ) for exp in expenses_data]

    balances = compute_net_balances(members, expenses_data)
    email_to_name = {m['username']: m['first_name'] for m in members}
    named_balances = {email_to_name[email]: float(bal) for email, bal in balances.items()}

    transactions = settle_balances(balances, members)
    return SettlementBreakdown(expenses=expenses_detail, balances=named_balances, transactions=transactions)