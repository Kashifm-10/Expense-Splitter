from rest_framework.permissions import BasePermission

class IsGroupMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        group = obj if hasattr(obj, 'members') else obj.group
        return group.members.filter(id=request.user.id).exists()