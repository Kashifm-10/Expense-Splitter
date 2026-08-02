from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from tenants.models import Tenant, TenantMember

class TenantAwareJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, validated_token = result
        tenant_id = validated_token.get('tenant_id')
        if not tenant_id:
            raise AuthenticationFailed('No tenant_id in token')
        try:
            tenant = Tenant.objects.get(tenant_id=tenant_id, is_active=True)
        except Tenant.DoesNotExist:
            raise AuthenticationFailed('Invalid or inactive tenant')
        try:
            member = TenantMember.objects.get(tenant=tenant, user=user)
        except TenantMember.DoesNotExist:
            raise AuthenticationFailed('User is not a member of this tenant')
        request.tenant_member = member
        request.tenant = tenant
        return (user, validated_token)