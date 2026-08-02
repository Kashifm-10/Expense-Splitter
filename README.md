# Multi-Tenant Expense Splitter (Full Stack)

## Setup
1. **Django backend**: `cd backend`, `python -m venv venv`, `.\venv\Scripts\activate`, `pip install -r requirements.txt`, `python manage.py makemigrations tenants core`, `python manage.py migrate`, `python manage.py runserver`
2. **Settlement service**: `cd settlement`, `python -m venv venv`, `.\venv\Scripts\activate`, `pip install -r requirements.txt`, `Copy-Item .env.example .env`, `uvicorn main:app --port 8001 --reload`
3. **React frontend**: `cd frontend`, `npm install`, `npm start`
Visit http://localhost:3000 (redirects to admin login)