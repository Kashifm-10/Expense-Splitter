from django.urls import path
from .views import (
    TenantCreateView, TenantUpdateView, TenantPublicRegisterView,
    TenantInfoView, TenantOwnedListView, TenantSoftDeleteView,
    TenantEnableView, TenantMemberListView, AdminCreateTenantView,
    AdminGetTenantTokenView
)

urlpatterns = [
    path('create/', TenantCreateView.as_view(), name='tenant-create'),
    path('<str:tenant_id>/update/', TenantUpdateView.as_view(), name='tenant-update'),
    path('<str:tenant_id>/register/', TenantPublicRegisterView.as_view(), name='tenant-public-register'),
    path('<str:tenant_id>/info/', TenantInfoView.as_view(), name='tenant-info'),
    path('owned/', TenantOwnedListView.as_view(), name='tenant-owned'),
    path('<str:tenant_id>/soft-delete/', TenantSoftDeleteView.as_view(), name='tenant-soft-delete'),
    path('<str:tenant_id>/enable/', TenantEnableView.as_view(), name='tenant-enable'),
    path('<str:tenant_id>/members/', TenantMemberListView.as_view(), name='tenant-members'),
    path('admin-create/', AdminCreateTenantView.as_view(), name='admin-create-tenant'),
    path('admin-get-tenant-token/', AdminGetTenantTokenView.as_view(), name='admin-get-tenant-token'),
]