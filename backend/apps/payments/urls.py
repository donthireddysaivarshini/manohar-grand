"""
URL routing for Payments domain (/api/v1/payments/).
"""
from django.urls import path
from .views import (
    payment_order_create,
    payment_verify,
    razorpay_webhook,
)

app_name = 'payments'

urlpatterns = [
    path('orders/', payment_order_create, name='payment-order-create'),
    path('verify/', payment_verify, name='payment-verify'),
    path('webhook/razorpay/', razorpay_webhook, name='payment-webhook-razorpay'),
    path('webhook/', razorpay_webhook, name='payment-webhook-alias'),
]
