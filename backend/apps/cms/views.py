"""
Views for CMS domain (Public Content Sections, Gallery, FAQs, Hotel Config, and Staff Admin Endpoints).
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GalleryMedia, HotelConfiguration, CMSSection, FAQ
from .serializers import (
    GalleryMediaSerializer,
    GalleryMediaAdminSerializer,
    CMSSectionSerializer,
    CMSSectionAdminSerializer,
    FAQSerializer,
    FAQAdminSerializer,
    HotelConfigurationPublicSerializer,
    HotelConfigurationAdminSerializer,
)
from apps.authentication.permissions import (
    IsManagerOrAbove,
    IsSuperAdmin,
)
from core.services import record_audit_log


# ==========================================
# PUBLIC CMS CONTENT APIs
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def public_cms_sections_list(request):
    """
    List all active public CMS marketing sections ordered by display_order.
    """
    sections = CMSSection.objects.filter(is_active=True)
    serializer = CMSSectionSerializer(sections, many=True)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_cms_section_detail(request, section_key):
    """
    Retrieve single active CMS marketing section by unique section key.
    """
    section = get_object_or_404(CMSSection, section_key=section_key.lower().strip(), is_active=True)
    serializer = CMSSectionSerializer(section)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_gallery_media_list(request):
    """
    List active photo gallery media. Supports ?category= and ?featured=true filtering.
    """
    media_qs = GalleryMedia.objects.filter(is_active=True)
    
    category_param = request.query_params.get('category')
    if category_param:
        media_qs = media_qs.filter(category=category_param)
        
    featured_param = request.query_params.get('featured')
    if featured_param and featured_param.lower() in ('true', '1'):
        media_qs = media_qs.filter(is_featured=True)

    serializer = GalleryMediaSerializer(media_qs, many=True, context={'request': request})
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat(),
            "total_count": media_qs.count()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_faqs_list(request):
    """
    List active hotel FAQs. Supports ?category= filtering.
    """
    faqs = FAQ.objects.filter(is_active=True)
    
    category_param = request.query_params.get('category')
    if category_param:
        faqs = faqs.filter(category=category_param)

    serializer = FAQSerializer(faqs, many=True)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat(),
            "total_count": faqs.count()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_hotel_configuration(request):
    """
    Retrieve public-safe hotel operational configuration (timings, policies, contact info).
    """
    config = HotelConfiguration.get_solo()
    serializer = HotelConfigurationPublicSerializer(config)
    return Response({
        "success": True,
        "data": serializer.data,
        "meta": {
            "timestamp": timezone.now().isoformat()
        }
    })


# ==========================================
# ADMIN CMS APIs
# ==========================================

class CMSSectionAdminListCreateView(APIView):
    """
    Staff CMS section list (Manager read-only / SuperAdmin)
    and section creation (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [IsManagerOrAbove()]

    def get(self, request):
        sections = CMSSection.objects.all()
        serializer = CMSSectionAdminSerializer(sections, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": sections.count()
            }
        })

    def post(self, request):
        serializer = CMSSectionAdminSerializer(data=request.data)
        if serializer.is_valid():
            section = serializer.save()
            record_audit_log(
                action='create',
                resource_type='CMSSection',
                resource_id=str(section.id),
                actor=request.user,
                new_values=serializer.data,
                reason=f"Created CMS section '{section.section_key}'",
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
                "message": "Invalid CMS section data.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class CMSSectionAdminDetailView(APIView):
    """
    CMS Section detail (Manager read-only), update and delete (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsSuperAdmin()]
        return [IsManagerOrAbove()]

    def get_object(self, pk):
        return get_object_or_404(CMSSection, pk=pk)

    def get(self, request, pk):
        section = self.get_object(pk)
        serializer = CMSSectionAdminSerializer(section)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request, pk):
        section = self.get_object(pk)
        old_data = CMSSectionAdminSerializer(section).data
        serializer = CMSSectionAdminSerializer(section, data=request.data, partial=True)
        if serializer.is_valid():
            updated_section = serializer.save()
            new_data = serializer.data
            record_audit_log(
                action='update',
                resource_type='CMSSection',
                resource_id=str(updated_section.id),
                actor=request.user,
                old_values=old_data,
                new_values=new_data,
                reason=f"Updated CMS section '{updated_section.section_key}'",
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
                "message": "Invalid CMS section update parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        section = self.get_object(pk)
        old_data = CMSSectionAdminSerializer(section).data
        key = section.section_key
        section_id = str(section.id)
        section.delete()

        record_audit_log(
            action='delete',
            resource_type='CMSSection',
            resource_id=section_id,
            actor=request.user,
            old_values=old_data,
            reason=f"Deleted CMS section '{key}'",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "success": True,
            "data": {
                "message": f"CMS section '{key}' successfully deleted."
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)


class FAQAdminListCreateView(APIView):
    """
    Staff FAQ list (Manager read-only / SuperAdmin)
    and FAQ creation (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [IsManagerOrAbove()]

    def get(self, request):
        faqs = FAQ.objects.all()
        serializer = FAQAdminSerializer(faqs, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": faqs.count()
            }
        })

    def post(self, request):
        serializer = FAQAdminSerializer(data=request.data)
        if serializer.is_valid():
            faq = serializer.save()
            record_audit_log(
                action='create',
                resource_type='FAQ',
                resource_id=str(faq.id),
                actor=request.user,
                new_values=serializer.data,
                reason=f"Created FAQ item",
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
                "message": "Invalid FAQ item data.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class FAQAdminDetailView(APIView):
    """
    FAQ detail (Manager read-only), update and delete (SuperAdmin only).
    """
    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsSuperAdmin()]
        return [IsManagerOrAbove()]

    def get_object(self, pk):
        return get_object_or_404(FAQ, pk=pk)

    def get(self, request, pk):
        faq = self.get_object(pk)
        serializer = FAQAdminSerializer(faq)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request, pk):
        faq = self.get_object(pk)
        old_data = FAQAdminSerializer(faq).data
        serializer = FAQAdminSerializer(faq, data=request.data, partial=True)
        if serializer.is_valid():
            updated_faq = serializer.save()
            new_data = serializer.data
            record_audit_log(
                action='update',
                resource_type='FAQ',
                resource_id=str(updated_faq.id),
                actor=request.user,
                old_values=old_data,
                new_values=new_data,
                reason=f"Updated FAQ item",
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
                "message": "Invalid FAQ item update parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        faq = self.get_object(pk)
        old_data = FAQAdminSerializer(faq).data
        faq_id = str(faq.id)
        faq.delete()

        record_audit_log(
            action='delete',
            resource_type='FAQ',
            resource_id=faq_id,
            actor=request.user,
            old_values=old_data,
            reason=f"Deleted FAQ item",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "success": True,
            "data": {
                "message": "FAQ item successfully deleted."
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)


class GalleryMediaAdminListCreateView(APIView):
    """
    Staff Gallery Media list and creation (Manager & SuperAdmin).
    """
    permission_classes = [IsManagerOrAbove]

    def get(self, request):
        media_items = GalleryMedia.objects.all()
        serializer = GalleryMediaAdminSerializer(media_items, many=True, context={'request': request})
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "total_count": media_items.count()
            }
        })

    def post(self, request):
        serializer = GalleryMediaAdminSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            media = serializer.save()
            record_audit_log(
                action='create',
                resource_type='GalleryMedia',
                resource_id=str(media.id),
                actor=request.user,
                new_values={'title': media.title, 'category': media.category, 'is_active': media.is_active},
                reason=f"Uploaded gallery media '{media.title}'",
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
                "message": "Invalid gallery media parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)


class GalleryMediaAdminDetailView(APIView):
    """
    Gallery Media detail, update, and delete (Manager & SuperAdmin).
    """
    permission_classes = [IsManagerOrAbove]

    def get_object(self, pk):
        return get_object_or_404(GalleryMedia, pk=pk)

    def get(self, request, pk):
        media = self.get_object(pk)
        serializer = GalleryMediaAdminSerializer(media, context={'request': request})
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request, pk):
        media = self.get_object(pk)
        old_data = {'title': media.title, 'category': media.category, 'is_active': media.is_active}
        serializer = GalleryMediaAdminSerializer(media, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated_media = serializer.save()
            new_data = serializer.data
            record_audit_log(
                action='update',
                resource_type='GalleryMedia',
                resource_id=str(updated_media.id),
                actor=request.user,
                old_values=old_data,
                new_values={'title': updated_media.title, 'category': updated_media.category, 'is_active': updated_media.is_active},
                reason=f"Updated gallery media '{updated_media.title}'",
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
                "message": "Invalid gallery media update parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        media = self.get_object(pk)
        old_data = {'title': media.title, 'category': media.category}
        media_id = str(media.id)
        media_title = media.title
        media.delete()

        record_audit_log(
            action='delete',
            resource_type='GalleryMedia',
            resource_id=media_id,
            actor=request.user,
            old_values=old_data,
            reason=f"Deleted gallery media '{media_title}'",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "success": True,
            "data": {
                "message": f"Gallery media '{media_title}' successfully deleted."
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)


class HotelConfigurationAdminView(APIView):
    """
    Staff view (Manager & SuperAdmin) and modification (SuperAdmin only)
    of singleton hotel operational configuration.
    """
    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH'):
            return [IsSuperAdmin()]
        return [IsManagerOrAbove()]

    def get(self, request):
        config = HotelConfiguration.get_solo()
        serializer = HotelConfigurationAdminSerializer(config)
        return Response({
            "success": True,
            "data": serializer.data,
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        })

    def patch(self, request):
        config = HotelConfiguration.get_solo()
        old_data = HotelConfigurationAdminSerializer(config).data
        serializer = HotelConfigurationAdminSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            updated_config = serializer.save()
            new_data = serializer.data
            record_audit_log(
                action='config_change',
                resource_type='HotelConfiguration',
                resource_id=str(updated_config.id),
                actor=request.user,
                old_values=old_data,
                new_values=new_data,
                reason="Updated hotel operational configuration via API",
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
                "message": "Invalid hotel configuration parameters.",
                "details": serializer.errors
            },
            "meta": {
                "timestamp": timezone.now().isoformat()
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)
