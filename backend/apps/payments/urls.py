"""
URL routing for Payments domain (/api/v1/payments/).
"""
from django.urls import path
from .views import payment_order_create

app_name = 'payments'

urlpatterns = [
    path('orders/', payment_order_create, name='payment-order-create'),
]
