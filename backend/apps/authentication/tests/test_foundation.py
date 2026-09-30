import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_health_check_endpoint():
    client = APIClient()
    url = reverse('api-health')
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert data['data']['status'] == 'healthy'
    assert 'Manohar Grand Hotel Backend API' in data['data']['service']
