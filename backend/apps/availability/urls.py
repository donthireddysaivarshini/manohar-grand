"""
URL routing for Availability domain (/api/v1/availability/).
"""
from django.urls import path
from .views import availability_search, availability_calendar

app_name = 'availability'

urlpatterns = [
    path('search/', availability_search, name='availability-search'),
    path('calendar/', availability_calendar, name='availability-calendar'),
]
