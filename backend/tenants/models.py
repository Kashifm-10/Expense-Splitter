import uuid
from django.db import models
from core.models import User

class Tenant(models.Model):
    tenant_id = models.CharField(max_length=8, unique=True, default='', editable=False)
    name = models.CharField(max_length=100)
    primary_color = models.CharField(max_length=7, default='#000000')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.tenant_id:
            self.tenant_id = uuid.uuid4().hex[:8].upper()
        # Capitalize tenant name before saving
        self.name = ' '.join(w.capitalize() for w in self.name.split())
        super().save(*args, **kwargs)

class TenantMember(models.Model):
    ROLE_CHOICES = [('OWNER', 'Owner'), ('MEMBER', 'Member')]
    tenant = models.ForeignKey(Tenant, to_field='tenant_id', db_column='tenant_id', on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, to_field='uuid', db_column='user_id', on_delete=models.CASCADE, related_name='tenant_memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tenant', 'user')