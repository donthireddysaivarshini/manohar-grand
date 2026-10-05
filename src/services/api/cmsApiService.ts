import { fetchApi } from '../apiClient';
import {
  ApiHotelConfiguration,
  ApiCMSSection,
  ApiGalleryMedia,
  ApiFAQ,
  ApiAmenityItem,
} from '../../types/cms';

export const cmsApiService = {
  /**
   * Fetches singleton hotel configuration including contact details, address, timings, and policies.
   * Endpoint: GET /api/v1/cms/hotel-config/
   */
  async getHotelConfig(): Promise<ApiHotelConfiguration> {
    const res = await fetchApi<ApiHotelConfiguration>('/api/v1/cms/hotel-config/');
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load hotel configuration');
  },

  /**
   * Fetches CMS editorial sections, optionally filtered by section_key.
   * Endpoint: GET /api/v1/cms/sections/
   */
  async getSections(sectionKey?: string): Promise<ApiCMSSection[]> {
    const query = sectionKey ? `?section_key=${encodeURIComponent(sectionKey)}` : '';
    const res = await fetchApi<ApiCMSSection[]>(`/api/v1/cms/sections/${query}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load CMS sections');
  },

  /**
   * Fetches gallery media items with absolute image URLs.
   * Endpoint: GET /api/v1/cms/gallery/
   */
  async getGallery(params?: { category?: string; featuredOnly?: boolean }): Promise<ApiGalleryMedia[]> {
    const queryParts: string[] = [];
    if (params?.category && params.category !== 'all') {
      queryParts.push(`category=${encodeURIComponent(params.category)}`);
    }
    if (params?.featuredOnly) {
      queryParts.push('featured=true');
    }
    const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await fetchApi<ApiGalleryMedia[]>(`/api/v1/cms/gallery/${query}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load gallery media');
  },

  /**
   * Fetches public FAQs.
   * Endpoint: GET /api/v1/cms/faqs/
   */
  async getFAQs(category?: string): Promise<ApiFAQ[]> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetchApi<ApiFAQ[]>(`/api/v1/cms/faqs/${query}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load FAQs');
  },

  /**
   * Fetches all amenities or property-wide amenities.
   * Endpoint: GET /api/v1/rooms/amenities/
   */
  async getAmenities(propertyWideOnly?: boolean): Promise<ApiAmenityItem[]> {
    const query = propertyWideOnly ? '?property_wide=true' : '';
    const res = await fetchApi<ApiAmenityItem[]>(`/api/v1/rooms/amenities/${query}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to load amenities');
  },
};
