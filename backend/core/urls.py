from django.urls import path
from .views import (
    TenantLoginView, AdminLoginView, TenantVerifyView, AdminVerifyView,
    TenantMemberListView, GroupListCreateView, GroupDetailView,
    GroupAddMemberView, GroupExpenseListCreateView, ExpenseDetailView,
    GroupLeaveView,
)

urlpatterns = [
    path('t/<str:tenant_id>/login/', TenantLoginView.as_view(), name='tenant-login'),
    path('t/<str:tenant_id>/verify/', TenantVerifyView.as_view(), name='tenant-verify'),
    path('admin/login/', AdminLoginView.as_view(), name='admin-login'),
    path('admin/verify/', AdminVerifyView.as_view(), name='admin-verify'),
    path('members/', TenantMemberListView.as_view(), name='tenant-members'),
    path('groups/', GroupListCreateView.as_view(), name='group-list'),
    path('groups/<str:group_id>/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/<str:group_id>/add-member/', GroupAddMemberView.as_view(), name='group-add-member'),
    path('groups/<str:group_id>/expenses/', GroupExpenseListCreateView.as_view(), name='group-expenses'),
    path('groups/<str:group_id>/leave/', GroupLeaveView.as_view(), name='group-leave'),
    path('expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
]