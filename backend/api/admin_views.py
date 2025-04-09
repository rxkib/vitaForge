# vitaforge/backend/api/admin_views.py
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import status

class AdminPermission(BasePermission):
    """
    Custom permission to allow access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class AdminDashboardView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request):
        # List all registered users for the admin dashboard.
        users = User.objects.all().values("id", "username", "email", "is_staff", "is_superuser")
        return Response({"users": list(users)}, status=status.HTTP_200_OK)

class DeleteUserView(APIView):
    permission_classes = [AdminPermission]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            # Prevent an admin from deleting their own account.
            if user.id == request.user.id:
                return Response({"error": "Admin cannot delete self."}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response({"message": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
