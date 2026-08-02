from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Tenant, TenantMember
from .serializers import (
    TenantCreateSerializer, TenantUpdateSerializer,
    TenantMemberRegisterSerializer, TenantInfoSerializer,
    TenantOwnedSerializer, AdminCreateTenantSerializer, TenantMemberSerializer,
    capitalize_name
)

class TenantCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = TenantCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        tenant = result['tenant']
        return Response({
            'message': 'Tenant created successfully!',
            'tenant_id': tenant.tenant_id,
            'tenant_name': tenant.name,
            'primary_color': tenant.primary_color,
        }, status=status.HTTP_201_CREATED)

class TenantUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, tenant_id):
        try:
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id, is_active=True)
            if not TenantMember.objects.filter(tenant=tenant, user=request.user, role='OWNER').exists():
                return Response({'error': 'Only the tenant owner can edit settings'}, status=403)
            serializer = TenantUpdateSerializer(tenant, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': f'Failed to update tenant: {str(e)}'}, status=500)

class TenantPublicRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, tenant_id):
        try:
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id, is_active=True)
            serializer = TenantMemberRegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            name = capitalize_name(serializer.validated_data['name'])
            email_lower = serializer.validated_data['email'].lower()
            username = email_lower
            password = serializer.validated_data['password']

            # Check if user already exists
            user = User.objects.filter(username=username).first()
            if user:
                # User exists: check if already a member of this tenant
                if TenantMember.objects.filter(tenant=tenant, user=user).exists():
                    return Response({'error': 'This email is already registered for this tenant.'}, status=400)
                # Reuse existing user, update name if changed
                if user.first_name != name:
                    user.first_name = name
                    user.save()
            else:
                # Create new user
                user = User.objects.create_user(
                    username=username,
                    email=email_lower,
                    password=password,
                    first_name=name
                )

            # Add user as member
            TenantMember.objects.create(tenant=tenant, user=user, role='MEMBER')

            # Auto-login: return JWT
            refresh = RefreshToken.for_user(user)
            refresh['tenant_id'] = tenant.tenant_id
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_name': user.first_name,
                'user_uuid': str(user.uuid),
                'tenant': {
                    'tenant_id': tenant.tenant_id,
                    'name': tenant.name,
                    'primary_color': tenant.primary_color,
                },
                'status': 'User registered and added to tenant',
            }, status=201)
        except Exception as e:
            return Response({'error': f'Registration failed: {str(e)}'}, status=500)

class TenantInfoView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, tenant_id):
        try:
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id, is_active=True)
            serializer = TenantInfoSerializer(tenant)
            return Response(serializer.data)
        except Exception:
            return Response({'error': 'Tenant not found'}, status=404)

# Admin views
class TenantOwnedListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    serializer_class = TenantOwnedSerializer

    def get_queryset(self):
        memberships = TenantMember.objects.filter(user=self.request.user, role='OWNER')
        return Tenant.objects.filter(tenant_id__in=memberships.values('tenant_id'))

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception:
            return Response({'error': 'Failed to fetch tenants.'}, status=500)

class TenantSoftDeleteView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, tenant_id):
        try:
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id)
            if not TenantMember.objects.filter(tenant=tenant, user=request.user, role='OWNER').exists():
                return Response({'error': 'Only the tenant owner can disable this tenant.'}, status=403)
            tenant.is_active = False
            tenant.save()
            return Response({'status': 'Tenant disabled successfully.'})
        except Exception as e:
            return Response({'error': f'Failed to disable tenant: {str(e)}'}, status=500)

class TenantEnableView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, tenant_id):
        try:
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id)
            if not TenantMember.objects.filter(tenant=tenant, user=request.user, role='OWNER').exists():
                return Response({'error': 'Only the tenant owner can enable this tenant.'}, status=403)
            tenant.is_active = True
            tenant.save()
            return Response({'status': 'Tenant enabled successfully.'})
        except Exception as e:
            return Response({'error': f'Failed to enable tenant: {str(e)}'}, status=500)

class TenantMemberListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, tenant_id):
        tenant = get_object_or_404(Tenant, tenant_id=tenant_id)
        if not TenantMember.objects.filter(tenant=tenant, user=request.user, role='OWNER').exists():
            return Response({'error': 'Only the owner can view members.'}, status=403)
        members = TenantMember.objects.filter(tenant=tenant)
        serializer = TenantMemberSerializer(members, many=True)
        return Response(serializer.data)

class AdminCreateTenantView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            serializer = AdminCreateTenantSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            tenant = serializer.create(serializer.validated_data)   # already capitalizes
            TenantMember.objects.create(tenant=tenant, user=request.user, role='OWNER')
            return Response({
                'message': 'Tenant created successfully',
                'tenant_id': tenant.tenant_id,
                'tenant_name': tenant.name
            }, status=201)
        except Exception as e:
            return Response({'error': f'Failed to create tenant: {str(e)}'}, status=500)

class AdminGetTenantTokenView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            tenant_id = request.data.get('tenant_id')
            if not tenant_id:
                return Response({'error': 'tenant_id required'}, status=400)
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id)
            if not TenantMember.objects.filter(tenant=tenant, user=request.user, role='OWNER').exists():
                return Response({'error': 'You are not the owner'}, status=403)
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(request.user)
            refresh['tenant_id'] = tenant.tenant_id
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'tenant': {
                    'tenant_id': tenant.tenant_id,
                    'name': tenant.name,
                    'primary_color': tenant.primary_color,
                }
            })
        except Exception as e:
            return Response({'error': f'Failed to get tenant token: {str(e)}'}, status=500)