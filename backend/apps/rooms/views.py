"""
Views for Rooms domain (Public Room Categories, Amenities, and Admin Physical Room Management).
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import RoomCategory, PhysicalRoom, Amenity
from .serializers import (
    RoomCategoryListSerializer,
    RoomCategoryDetailSerializer,
    AmenitySerializer,
    PhysicalRoomAdminSerializer,
)
from apps.authentication.permissions import (
    IsStaffUser,
    IsReceptionistOrAbove,
    IsManagerOrAbove,
    IsSuperAdmin,
)
from core.services import record_audit_log


# ==========================================
# PUBLIC ROOM APIs
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def public_room_category_list(request):
    """
    List all active room categories with derived physical room count,
    active amenities, active imagery, and active base rate pricing.
    """
    categories = RoomCategory.objects.filter(is_active=True).prefetch_related(
        'images',
        'category_amenity_links__amenity',
        'rate_plans',
        'physical_rooms',
    )
    serializer = RoomCategoryListSerializer(categories, many=True, context={'request': request})
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_room_category_detail(request, slug):
    """
    Retrieve single active room category specifications by slug.
    """
    category = get_object_or_404(
        RoomCategory.objects.prefetch_related(
            'images',
            'category_amenity_links__amenity',
            'rate_plans',
            'physical_rooms',
        ),
        slug=slug,
        is_active=True
    )
    serializer = RoomCategoryDetailSerializer(category, context={'request': request})
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_amenity_list(request):
    """
    List all active property amenities.
    """
    amenities = Amenity.objects.filter(is_active=True)
    serializer = AmenitySerializer(amenities, many=True)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


# ==========================================
# ADMIN PHYSICAL ROOM APIs
# ==========================================

class PhysicalRoomAdminListCreateView(APIView):
    """
    Staff physical room inventory list (Receptionist/Manager/SuperAdmin)
    and physical room unit creation (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [IsReceptionistOrAbove()]

    def get(self, request):
        rooms = PhysicalRoom.objects.select_related('category').all()
        
        # Optional query filters
        category_param = request.query_params.get('category')
        if category_param:
            rooms = rooms.filter(category__slug=category_param) | rooms.filter(category__id=category_param) if '-' in category_param else rooms.filter(category__slug=category_param)
        
        status_param = request.query_params.get('status')
        if status_param:
            rooms = rooms.filter(operational_status=status_param)

        floor_param = request.query_params.get('floor')
        if floor_param and floor_param.isdigit():
            rooms = rooms.filter(floor=int(floor_param))

        serializer = PhysicalRoomAdminSerializer(rooms, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": rooms.count(),
            }
        })

    def post(self, request):
        serializer = PhysicalRoomAdminSerializer(data=request.data)
        if serializer.is_valid():
            room = serializer.save()
            
            # Record audit log
            record_audit_log(
                action='create',
                resource_type='PhysicalRoom',
                resource_id=str(room.id),
                actor=request.user,
                new_values=serializer.data,
                reason=f"Created physical room unit {room.room_number}",
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            return Response({
                "success": True,
                "data": serializer.data,
                "meta": {
                    "timestamp": timezone.now().isoformat()
                }
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid physical room parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class PhysicalRoomAdminDetailView(APIView):
    """
    Physical room unit detail, operational status mutation, and deletion.
    """
    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsSuperAdmin()]
        if self.request.method in ('PUT', 'PATCH'):
            return [IsManagerOrAbove()]
        return [IsReceptionistOrAbove()]

    def get_object(self, pk):
        return get_object_or_404(PhysicalRoom.objects.select_related('category'), pk=pk)

    def get(self, request, pk):
        room = self.get_object(pk)
        serializer = PhysicalRoomAdminSerializer(room)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request, pk):
        room = self.get_object(pk)
        old_data = PhysicalRoomAdminSerializer(room).data
        serializer = PhysicalRoomAdminSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            updated_room = serializer.save()
            new_data = serializer.data

            action = 'status_change' if 'operational_status' in request.data and len(request.data) == 1 else 'update'
            record_audit_log(
                action=action,
                resource_type='PhysicalRoom',
                resource_id=str(updated_room.id),
                actor=request.user,
                old_values=old_data,
                new_values=new_data,
                reason=f"Updated physical room {updated_room.room_number}",
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            return Response({
                "success": True,
                "data": new_data,
                "meta": {
                    "timestamp": timezone.now().isoformat()
                }
            })

        return Response({
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid physical room update data.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        room = self.get_object(pk)
        old_data = PhysicalRoomAdminSerializer(room).data
        room_number = room.room_number
        room_id = str(room.id)
        room.delete()

        record_audit_log(
            action='delete',
            resource_type='PhysicalRoom',
            resource_id=room_id,
            actor=request.user,
            old_values=old_data,
            reason=f"Deleted physical room unit {room_number}",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "success": True,
            "data": {
                "message": f"Physical room {room_number} successfully deleted."
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)
