# Notes

All original requirements implemented (email login, capitalisation, ₹, tenant_id/group_id as primary keys, admin multi‑tenant, enable/disable, settlement with exact split, etc.)

## Expanded Scope Additions

### 1. Group Management
- **Edit group name** – only the group creator can edit.
- **Delete group** – only the creator can delete. Deletion is permanent and cascades to all expenses (including soft‑deleted).
- **Leave group** – a member can leave if their net balance is zero. If the creator leaves, ownership automatically transfers to the next member (oldest). A modal shows the next owner’s name.

### 2. Expense Management
- **Created_by** field added to track who added the expense.
- **Soft delete** – expenses are marked `is_deleted=True` and `deleted_at` timestamped; they remain visible in the UI but are greyed out, struck through, and excluded from settlements.
- **Edit expense** – only the creator can edit description, amount, or paid_by (payer must be a group member). An “Edited” badge appears if `updated_at` > `created_at`.
- **Delete expense** – only the creator can soft‑delete; cannot be edited after deletion.
- **Add expense modal** – includes a “Paid by” dropdown (defaults to current user). The selected payer is respected in the backend.

### 3. Settlement Service
- Filtered out `is_deleted=True` expenses before computing balances, ensuring deleted expenses do not affect who owes whom.

### 4. UI/UX
- All destructive actions use the reusable `Modal` component with clear warnings.
- Delete group requires typing “DELETE” to confirm.
- Leave group modal shows the next owner if the creator is leaving.
- Expenses show “Edited” or “Deleted” badges.
- **Custom Alert Modal** replaces all browser `alert()` calls for a consistent, polished experience.
- **Added by** column in the expenses table shows who created the expense.

### 5. Permission & Isolation
- Strict tenant isolation enforced by `TenantAwareJWTAuthentication` – all queries filter by `request.tenant`.
- Group membership checks using `IsGroupMember` permission.
- Expense edit/delete restricted to `created_by`.
- Uses **UUID** as the user identifier across the system (all foreign keys use `to_field='uuid'`).

### 6. Edge Cases Handled
- Last member cannot leave (must delete group).
- Outstanding balance prevents leaving (with error message showing amount).
- Cannot edit a soft‑deleted expense.
- Payer validation ensures they are a member of the group.
- Settlement service handles empty groups gracefully.

### One thing I didn’t know before
- Django’s `to_field` on `ForeignKey` allows referencing non‑primary key fields (e.g., `uuid`). This simplified relationships without adding redundant fields.

### One AI correction
- AI initially suggested adding a separate `user_id` field in `TenantMember`. I corrected it to use `to_field='uuid'` on the `ForeignKey` directly, keeping the model clean and consistent.

### One thing I’d do differently with more time
- Implement full audit logging for all changes (who edited what, when).
- Add email verification and password reset flows.
- Dockerize the entire stack for easier deployment.
- Build a comprehensive test suite (unit + integration).
- Allow admins to restore soft‑deleted expenses.