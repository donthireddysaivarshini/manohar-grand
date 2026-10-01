"""
Hospitality date calculation and stay-night derivation utilities.
"""
from datetime import date, timedelta
from typing import List
from django.core.exceptions import ValidationError


def get_stay_nights(check_in: date, check_out: date) -> List[date]:
    """
    Returns the exact list of calendar dates consumed as overnight stays.
    Hospitality industry standard night interval: [check_in, check_out).
    The check-out date itself is never consumed as an overnight stay.

    Example:
        check_in = 2026-10-10, check_out = 2026-10-13
        returns: [2026-10-10, 2026-10-11, 2026-10-12] (3 nights)
    """
    if not isinstance(check_in, date) or not isinstance(check_out, date):
        raise ValidationError("check_in and check_out must be valid date objects.")

    if check_out <= check_in:
        raise ValidationError({
            "check_out": "Check-out date must be strictly after check-in date."
        })

    stay_nights = []
    current_date = check_in
    while current_date < check_out:
        stay_nights.append(current_date)
        current_date += timedelta(days=1)

    return stay_nights


def calculate_nights_count(check_in: date, check_out: date) -> int:
    """
    Returns the total integer number of nights between check-in and check-out.
    """
    if check_out <= check_in:
        raise ValidationError({
            "check_out": "Check-out date must be strictly after check-in date."
        })
    return (check_out - check_in).days
