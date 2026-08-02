import uuid
from django.db import transaction
from rest_framework import serializers
from core.models import User
from .models import Tenant, TenantMember

def capitalize_name(name):
    return ' '.join(w.capitalize() for w in name.split())

class TenantCreateSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=100)
    owner_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    primary_color = serializers.CharField(max_length=7, default='#000000')

    def create(self, validated_data):
        with transaction.atomic():
            email_lower = validated_data['email'].lower()
            username = email_lower
            owner_name = capitalize_name(validated_data['owner_name'])
            company_name = capitalize_name(validated_data['company_name'])
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({'email': 'A user with this email already exists.'})
            user = User.objects.create_user(
                username=username,
                email=email_lower,
                password=validated_data['password'],
                first_name=owner_name
            )
            tenant = Tenant.objects.create(
                name=company_name,
                primary_color=validated_data['primary_color']
            )
            TenantMember.objects.create(tenant=tenant, user=user, role='OWNER')
            return {'tenant': tenant, 'user': user}

class TenantUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['name', 'primary_color']

    def update(self, instance, validated_data):
        if 'name' in validated_data:
            validated_data['name'] = capitalize_name(validated_data['name'])
        return super().update(instance, validated_data)

class TenantMemberRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class TenantInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['tenant_id', 'name', 'primary_color']

class TenantOwnedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'tenant_id', 'name', 'primary_color', 'is_active', 'created_at']

class AdminCreateTenantSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=100)
    primary_color = serializers.CharField(max_length=7, default='#000000')

    def create(self, validated_data):
        company_name = capitalize_name(validated_data['company_name'])
        tenant = Tenant.objects.create(
            name=company_name,
            primary_color=validated_data['primary_color']
        )
        return tenant

class TenantMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.first_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = TenantMember
        fields = ['id', 'username', 'name', 'role', 'joined_at']