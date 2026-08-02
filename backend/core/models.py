import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.username

class GroupMember(models.Model):
    group = models.ForeignKey('Group', to_field='group_id', db_column='group_id', on_delete=models.CASCADE)
    user = models.ForeignKey(User, to_field='uuid', db_column='tenantmember_id', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('group', 'user')

class Group(models.Model):
    group_id = models.CharField(max_length=8, unique=True, default='', editable=False)
    tenant = models.ForeignKey('tenants.Tenant', to_field='tenant_id', db_column='tenant_id', on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, to_field='uuid', db_column='created_by_id', on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(User, through=GroupMember, related_name='group_memberships')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.group_id:
            self.group_id = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

class Expense(models.Model):
    group = models.ForeignKey(Group, to_field='group_id', db_column='group_id', on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_by = models.ForeignKey(User, to_field='uuid', db_column='paid_by_id', on_delete=models.CASCADE, related_name='paid_expenses')
    created_by = models.ForeignKey(User, to_field='uuid', db_column='created_by_id', on_delete=models.CASCADE, related_name='created_expenses', null=True)  # who added the expense
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)