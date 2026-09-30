"""
Serializers for User, CustomerProfile, StaffProfile, and authentication operations.
"""
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User, CustomerProfile, StaffProfile

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['id', 'city', 'state', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['id', 'role', 'employee_id', 'is_active_duty', 'created_at', 'updated_at']
        read_only_fields = ['id', 'employee_id', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    staff_profile = StaffProfileSerializer(read_only=True)
    role = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'role',
            'is_staff',
            'is_superuser',
            'is_active',
            'auth_provider',
            'customer_profile',
            'staff_profile',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'role',
            'is_staff',
            'is_superuser',
            'is_active',
            'auth_provider',
            'created_at',
            'updated_at',
        ]

class StaffLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')

        user = authenticate(request=request, username=email, password=password)
        if not user:
            raise serializers.ValidationError({"error": "Invalid email or password credentials."})

        if not user.is_active:
            raise serializers.ValidationError({"error": "User account is inactive."})

        if not user.is_staff and not user.is_superuser:
            raise serializers.ValidationError({"error": "Access denied. Only authorized hotel staff may log in here."})

        if not user.is_superuser:
            if not hasattr(user, 'staff_profile') or not user.staff_profile.is_active_duty:
                raise serializers.ValidationError({"error": "Staff account is not on active duty."})

        attrs['user'] = user
        return attrs

class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def update(self, user, validated_data):
        user.first_name = validated_data.get('first_name', user.first_name)
        user.last_name = validated_data.get('last_name', user.last_name)
        user.phone = validated_data.get('phone', user.phone)
        user.save(update_fields=['first_name', 'last_name', 'phone'])

        if hasattr(user, 'customer_profile') and user.customer_profile:
            profile = user.customer_profile
            profile.city = validated_data.get('city', profile.city)
            profile.state = validated_data.get('state', profile.state)
            profile.save(update_fields=['city', 'state'])

        return user
