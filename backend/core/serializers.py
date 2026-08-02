from rest_framework import serializers
from core.models import User
from tenants.models import TenantMember
from .models import Group, Expense

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['uuid', 'username', 'first_name', 'last_name', 'email']

class TenantLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class TenantMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.first_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = TenantMember
        fields = ['id', 'username', 'name', 'role', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    class Meta:
        model = Group
        fields = ['id', 'group_id', 'tenant', 'name', 'created_by', 'members', 'created_at']
        read_only_fields = ['tenant', 'created_by', 'members']

class GroupAddMemberSerializer(serializers.Serializer):
    usernames = serializers.ListField(child=serializers.CharField())

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by_email = serializers.CharField(source='paid_by.username', read_only=True)
    paid_by_name = serializers.CharField(source='paid_by.first_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.first_name', read_only=True)
    class Meta:
        model = Expense
        fields = ['id', 'group', 'description', 'amount', 'paid_by', 'paid_by_email', 'paid_by_name',
                  'created_by', 'created_by_name', 'created_at', 'updated_at', 'is_deleted', 'deleted_at']
        read_only_fields = ['group', 'paid_by_email', 'paid_by_name', 'created_by_name', 'created_at', 'updated_at', 'is_deleted', 'deleted_at']
        extra_kwargs = {
            'paid_by': {'required': False}   # allow creation without paid_by (view will set it)
        }

    def validate_paid_by(self, value):
        # Ensure the payer is a member of the group
        group = self.instance.group if self.instance else self.context.get('group')
        if group and value and not group.members.filter(uuid=value.uuid).exists():
            raise serializers.ValidationError("User is not a member of this group.")
        return value