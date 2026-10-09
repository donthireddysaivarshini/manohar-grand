"""
Admin API views for Inventory management: Stop-Sells / Blackout Dates.
Allows staff and managers to mark the hotel fully booked or close specific room categories.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.authentication.permissions import IsReceptionistOrAbove
from .models import StopSell
from apps.rooms.models import RoomCategory
import datetime


class AdminStopSellListCreateView(APIView):
    """
    GET /api/v1/admin/inventory/stop-sells/
    POST /api/v1/admin/inventory/stop-sells/
    """
    permission_classes = [IsReceptionistOrAbove]

    def get(self, request):
        qs = StopSell.objects.all().select_related('category', 'created_by')
        is_active_param = request.query_params.get('is_active')
        if is_active_param is not None:
            is_active_val = is_active_param.lower() in ('true', '1')
            qs = qs.filter(is_active=is_active_val)

        data = []
        for s in qs:
            data.append({
                'id': str(s.id),
                'start_date': s.start_date.isoformat(),
                'end_date': s.end_date.isoformat(),
                'nights_count': s.nights_count,
                'is_hotel_wide': s.is_hotel_wide,
                'category_id': str(s.category.id) if s.category else None,
                'category_name': s.category.name if s.category else None,
                'reason': s.reason,
                'notes': s.notes,
                'is_active': s.is_active,
                'created_by': s.created_by.get_full_name() or s.created_by.username if s.created_by else 'Staff',
                'created_at': s.created_at.isoformat(),
            })

        return Response({
            'success': True,
            'data': data
        })

    def post(self, request):
        data = request.data
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        is_hotel_wide = data.get('is_hotel_wide', True)
        category_id = data.get('category_id')
        reason = data.get('reason', 'Hotel Fully Booked')
        notes = data.get('notes', '')

        if not start_date_str or not end_date_str:
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'start_date and end_date are required (YYYY-MM-DD).'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.date.fromisoformat(start_date_str)
            end_date = datetime.date.fromisoformat(end_date_str)
        except ValueError:
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Invalid date format. Use YYYY-MM-DD.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        if end_date <= start_date:
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'end_date must be strictly after start_date.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        category = None
        if not is_hotel_wide:
            if not category_id:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'category_id is required when is_hotel_wide is False.'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            try:
                category = RoomCategory.objects.get(id=category_id)
            except RoomCategory.DoesNotExist:
                return Response({
                    'success': False,
                    'error': {
                        'code': 'NOT_FOUND',
                        'message': 'RoomCategory not found.'
                    }
                }, status=status.HTTP_404_NOT_FOUND)

        stop_sell = StopSell.objects.create(
            start_date=start_date,
            end_date=end_date,
            is_hotel_wide=is_hotel_wide,
            category=category,
            reason=reason,
            notes=notes,
            is_active=True,
            created_by=request.user if request.user.is_authenticated else None,
        )

        return Response({
            'success': True,
            'data': {
                'id': str(stop_sell.id),
                'start_date': stop_sell.start_date.isoformat(),
                'end_date': stop_sell.end_date.isoformat(),
                'nights_count': stop_sell.nights_count,
                'is_hotel_wide': stop_sell.is_hotel_wide,
                'category_id': str(stop_sell.category.id) if stop_sell.category else None,
                'category_name': stop_sell.category.name if stop_sell.category else None,
                'reason': stop_sell.reason,
                'is_active': stop_sell.is_active,
            }
        }, status=status.HTTP_201_CREATED)


class AdminStopSellToggleView(APIView):
    """
    POST /api/v1/admin/inventory/stop-sells/<pk>/toggle/
    """
    permission_classes = [IsReceptionistOrAbove]

    def post(self, request, pk):
        try:
            stop_sell = StopSell.objects.get(pk=pk)
        except StopSell.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'StopSell record not found.'
                }
            }, status=status.HTTP_404_NOT_FOUND)

        stop_sell.is_active = not stop_sell.is_active
        stop_sell.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'data': {
                'id': str(stop_sell.id),
                'is_active': stop_sell.is_active,
                'message': f"StopSell {'activated' if stop_sell.is_active else 'deactivated'} successfully."
            }
        })


class AdminStopSellDeleteView(APIView):
    """
    DELETE /api/v1/admin/inventory/stop-sells/<pk>/
    """
    permission_classes = [IsReceptionistOrAbove]

    def delete(self, request, pk):
        try:
            stop_sell = StopSell.objects.get(pk=pk)
        except StopSell.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'StopSell record not found.'
                }
            }, status=status.HTTP_404_NOT_FOUND)

        stop_sell.delete()
        return Response({
            'success': True,
            'data': {
                'message': 'StopSell removed successfully.'
            }
        })
