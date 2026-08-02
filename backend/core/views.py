from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.db.models import Sum
from django.utils import timezone
from decimal import Decimal
from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import PermissionDenied
from tenants.models import Tenant, TenantMember
from .models import Group, Expense
from .serializers import (
    TenantLoginSerializer, TenantMemberSerializer, GroupSerializer,
    ExpenseSerializer, GroupAddMemberSerializer,
)
from .permissions import IsGroupMember

class TenantLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, tenant_id):
        serializer = TenantLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email_lower = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']
        try:
            user = authenticate(username=email_lower, password=password)
            if user is None:
                return Response({'error': 'Invalid email or password.'}, status=401)
            tenant = get_object_or_404(Tenant, tenant_id=tenant_id, is_active=True)
            if not TenantMember.objects.filter(tenant=tenant, user=user).exists():
                return Response({'error': 'You are not a member of this tenant.'}, status=403)
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
                }
            })
        except Exception as e:
            return Response({'error': 'Login failed. Please try again.'}, status=500)

class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TenantLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email_lower = serializer.validated_data['email'].lower()
        password = serializer.validated_data['password']
        try:
            user = authenticate(username=email_lower, password=password)
            if user is None:
                return Response({'error': 'Invalid email or password.'}, status=401)
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'email': user.email,
                    'name': user.first_name
                }
            })
        except Exception as e:
            return Response({'error': 'Admin login failed.'}, status=500)

class TenantVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, tenant_id):
        tenant = get_object_or_404(Tenant, tenant_id=tenant_id, is_active=True)
        return Response({'valid': True, 'tenant_name': tenant.name, 'primary_color': tenant.primary_color})

class AdminVerifyView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'valid': True, 'email': request.user.email, 'name': request.user.first_name})

class TenantMemberListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            members = TenantMember.objects.filter(tenant=request.tenant)
            serializer = TenantMemberSerializer(members, many=True)
            return Response(serializer.data)
        except Exception:
            return Response({'error': 'Failed to fetch members.'}, status=500)

class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(tenant=self.request.tenant, members=self.request.user)

    def perform_create(self, serializer):
        group = serializer.save(tenant=self.request.tenant, created_by=self.request.user)
        group.members.add(self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': f'Failed to create group: {str(e)}'}, status=500)

class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    lookup_field = 'group_id'

    def get_queryset(self):
        return Group.objects.filter(tenant=self.request.tenant, members=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.created_by != self.request.user:
            raise PermissionDenied("Only the group creator can edit the group name.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user:
            raise PermissionDenied("Only the group creator can delete this group.")
        instance.delete()

class GroupAddMemberView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        try:
            group = get_object_or_404(Group, group_id=group_id, tenant=request.tenant)
            self.check_object_permissions(request, group)
            serializer = GroupAddMemberSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            usernames = serializer.validated_data['usernames']
            added = []
            errors = []
            for username in usernames:
                try:
                    user_to_add = User.objects.get(username=username)
                except User.DoesNotExist:
                    errors.append(f'User {username} not found.')
                    continue
                # Check if user is a member of this tenant
                if not TenantMember.objects.filter(tenant=request.tenant, user=user_to_add).exists():
                    errors.append(f'{username} is not a member of this tenant.')
                    continue
                if group.members.filter(id=user_to_add.id).exists():
                    errors.append(f'{username} is already in the group.')
                else:
                    group.members.add(user_to_add)
                    added.append(username)
            return Response({'status': f'Added {len(added)} member(s).', 'added': added, 'errors': errors})
        except Exception as e:
            return Response({'error': f'Failed to add members: {str(e)}'}, status=500)

class GroupExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group = get_object_or_404(Group, group_id=self.kwargs['group_id'], tenant=self.request.tenant)
        self.check_object_permissions(self.request, group)
        return group.expenses.all()

    def perform_create(self, serializer):
        group = get_object_or_404(Group, group_id=self.kwargs['group_id'], tenant=self.request.tenant)
        self.check_object_permissions(self.request, group)
        # Get paid_by from validated data, else use current user
        paid_by = serializer.validated_data.get('paid_by', self.request.user)
        serializer.context['group'] = group
        serializer.save(group=group, paid_by=paid_by, created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': f'Failed to add expense: {str(e)}'}, status=500)

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(group__members=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.is_deleted:
            raise serializers.ValidationError("Cannot edit a deleted expense.")
        if instance.created_by != self.request.user:
            raise PermissionDenied("Only the user who added this expense can edit it.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.is_deleted:
            raise serializers.ValidationError("Expense already deleted.")
        if instance.created_by != self.request.user:
            raise PermissionDenied("Only the user who added this expense can delete it.")
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()

class GroupLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, group_id=group_id, tenant=request.tenant)

        if not group.members.filter(id=request.user.id).exists():
            return Response({'error': 'You are not a member of this group.'}, status=403)

        if group.members.count() == 1:
            return Response({
                'error': 'Cannot leave: you are the only member. You can delete the group instead.'
            }, status=400)

        active_expenses = group.expenses.filter(is_deleted=False)
        total_cents = active_expenses.aggregate(total=Sum('amount'))['total'] or Decimal(0)
        total_cents = int(total_cents * 100)
        paid_cents = active_expenses.filter(paid_by=request.user).aggregate(paid=Sum('amount'))['paid'] or Decimal(0)
        paid_cents = int(paid_cents * 100)
        member_count = group.members.count()
        if total_cents > 0 and member_count > 0:
            base_share = total_cents // member_count
            remainder = total_cents - base_share * member_count
            usernames = sorted([m.username for m in group.members.all()])
            try:
                idx = usernames.index(request.user.username)
            except ValueError:
                idx = 0
            user_share = base_share + (1 if idx < remainder else 0)
            net = paid_cents - user_share
            if net != 0:
                balance = Decimal(net) / Decimal(100)
                return Response({
                    'error': f'Cannot leave: you have an outstanding balance of ₹{abs(balance):.2f}. Please settle up first.'
                }, status=400)

        group.members.remove(request.user)

        next_owner_name = None
        if group.created_by == request.user:
            next_owner = group.members.first()
            if next_owner:
                group.created_by = next_owner
                group.save()
                next_owner_name = next_owner.first_name

        return Response({
            'status': 'You have left the group successfully.',
            'next_owner_name': next_owner_name
        })