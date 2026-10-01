"""
Views for Pricing & Tax domain (Public Rates/Taxes and Staff Admin Rate Management).
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import RoomRatePlan, TaxRule
from .serializers import (
    RoomRatePlanPublicSerializer,
    RoomRatePlanAdminSerializer,
    TaxRulePublicSerializer,
    TaxRuleAdminSerializer,
)
from apps.authentication.permissions import (
    IsReceptionistOrAbove,
    IsSuperAdmin,
)
from core.services import record_audit_log


# ==========================================
# PUBLIC PRICING APIs
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def public_rate_plans_list(request):
    """
    List all active public room rate plans.
    """
    rates = RoomRatePlan.objects.filter(is_active=True).select_related('category')
    serializer = RoomRatePlanPublicSerializer(rates, many=True)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat(),
            "total_count": rates.count()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_tax_rules_list(request):
    """
    List all active public tax rules.
    """
    taxes = TaxRule.objects.filter(is_active=True)
    serializer = TaxRulePublicSerializer(taxes, many=True)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat(),
            "total_count": taxes.count()
        }
    })


# ==========================================
# ADMIN PRICING & TAX APIs
# ==========================================

class RoomRatePlanAdminListCreateView(APIView):
    """
    Staff rate plan view (Receptionist/Manager/SuperAdmin)
    and rate plan creation (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [IsReceptionistOrAbove()]

    def get(self, request):
        rates = RoomRatePlan.objects.select_related('category').all()
        serializer = RoomRatePlanAdminSerializer(rates, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": rates.count()
            }
        })

    def post(self, request):
        serializer = RoomRatePlanAdminSerializer(data=request.data)
        if serializer.is_valid():
            rate_plan = serializer.save()
            record_audit_log(
                action='price_change',
                resource_type='RoomRatePlan',
                resource_id=str(rate_plan.id),
                actor=request.user,
                new_values={
                    'name': rate_plan.name,
                    'base_price_per_night': str(rate_plan.base_price_per_night),
                    'extra_adult_charge': str(rate_plan.extra_adult_charge),
                    'extra_child_charge': str(rate_plan.extra_child_charge),
                    'late_checkout_hourly_rate': str(rate_plan.late_checkout_hourly_rate),
                },
                reason=f"Created rate plan '{rate_plan.name}' for {rate_plan.category.name}",
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
                "message": "Invalid rate plan parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class RoomRatePlanAdminDetailView(APIView):
    """
    Rate plan detail (all staff), update and deletion (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsSuperAdmin()]
        return [IsReceptionistOrAbove()]

    def get_object(self, pk):
        return get_object_or_404(RoomRatePlan.objects.select_related('category'), pk=pk)

    def get(self, request, pk):
        rate = self.get_object(pk)
        serializer = RoomRatePlanAdminSerializer(rate)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request, pk):
        rate = self.get_object(pk)
        old_data = {
            'name': rate.name,
            'base_price_per_night': str(rate.base_price_per_night),
            'extra_adult_charge': str(rate.extra_adult_charge),
            'extra_child_charge': str(rate.extra_child_charge),
            'late_checkout_hourly_rate': str(rate.late_checkout_hourly_rate),
            'is_active': rate.is_active,
        }
        serializer = RoomRatePlanAdminSerializer(rate, data=request.data, partial=True)
        if serializer.is_valid():
            updated_rate = serializer.save()
            new_data = serializer.data
            record_audit_log(
                action='price_change',
                resource_type='RoomRatePlan',
                resource_id=str(updated_rate.id),
                actor=request.user,
                old_values=old_data,
                new_values={
                    'name': updated_rate.name,
                    'base_price_per_night': str(updated_rate.base_price_per_night),
                    'extra_adult_charge': str(updated_rate.extra_adult_charge),
                    'extra_child_charge': str(updated_rate.extra_child_charge),
                    'late_checkout_hourly_rate': str(updated_rate.late_checkout_hourly_rate),
                    'is_active': updated_rate.is_active,
                },
                reason=f"Updated rate plan '{updated_rate.name}'",
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
                "message": "Invalid rate plan update parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        rate = self.get_object(pk)
        old_data = {'name': rate.name, 'base_price_per_night': str(rate.base_price_per_night)}
        rate_id = str(rate.id)
        rate_name = rate.name
        rate.delete()

        record_audit_log(
            action='delete',
            resource_type='RoomRatePlan',
            resource_id=rate_id,
            actor=request.user,
            old_values=old_data,
            reason=f"Deleted rate plan '{rate_name}'",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "success": True,
            "data": {
                "message": f"Rate plan '{rate_name}' successfully deleted."
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)


class TaxRuleAdminListCreateView(APIView):
    """
    Staff tax rule view (Receptionist/Manager/SuperAdmin)
    and tax rule creation (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [IsReceptionistOrAbove()]

    def get(self, request):
        taxes = TaxRule.objects.all()
        serializer = TaxRuleAdminSerializer(taxes, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": taxes.count()
            }
        })

    def post(self, request):
        serializer = TaxRuleAdminSerializer(data=request.data)
        if serializer.is_valid():
            tax_rule = serializer.save()
            record_audit_log(
                action='price_change',
                resource_type='TaxRule',
                resource_id=str(tax_rule.id),
                actor=request.user,
                new_values={
                    'name': tax_rule.name,
                    'tax_rate': str(tax_rule.tax_rate),
                    'tax_type': tax_rule.tax_type,
                },
                reason=f"Created tax rule '{tax_rule.name}'",
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
                "message": "Invalid tax rule parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class TaxRuleAdminDetailView(APIView):
    """
    Tax rule detail (all staff), update and deletion (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsSuperAdmin()]
        return [IsReceptionistOrAbove()]

    def get_object(self, pk):
        return get_object_or_404(TaxRule, pk=pk)

    def get(self, request, pk):
        tax = self.get_object(pk)
        serializer = TaxRuleAdminSerializer(tax)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request, pk):
        tax = self.get_object(pk)
        old_data = {
            'name': tax.name,
            'tax_rate': str(tax.tax_rate),
            'tax_type': tax.tax_type,
            'is_active': tax.is_active,
        }
        serializer = TaxRuleAdminSerializer(tax, data=request.data, partial=True)
        if serializer.is_valid():
            updated_tax = serializer.save()
            new_data = serializer.data
            record_audit_log(
                action='price_change',
                resource_type='TaxRule',
                resource_id=str(updated_tax.id),
                actor=request.user,
                old_values=old_data,
                new_values={
                    'name': updated_tax.name,
                    'tax_rate': str(updated_tax.tax_rate),
                    'tax_type': updated_tax.tax_type,
                    'is_active': updated_tax.is_active,
                },
                reason=f"Updated tax rule '{updated_tax.name}'",
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
                "message": "Invalid tax rule update parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        tax = self.get_object(pk)
        old_data = {'name': tax.name, 'tax_rate': str(tax.tax_rate)}
        tax_id = str(tax.id)
        tax_name = tax.name
        tax.delete()

        record_audit_log(
            action='delete',
            resource_type='TaxRule',
            resource_id=tax_id,
            actor=request.user,
            old_values=old_data,
            reason=f"Deleted tax rule '{tax_name}'",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "success": True,
            "data": {
                "message": f"Tax rule '{tax_name}' successfully deleted."
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)
