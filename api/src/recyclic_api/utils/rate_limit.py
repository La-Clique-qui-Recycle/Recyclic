import os
from typing import Callable

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


limiter = Limiter(key_func=get_remote_address)


def _is_test_mode() -> bool:
    return (
        os.getenv("PYTEST_CURRENT_TEST") is not None
        or os.getenv("TESTING") == "true"
        or os.getenv("ENVIRONMENT") == "test"
    )


def conditional_rate_limit(limit_str: str) -> Callable:
    """Apply a rate limit unless the application is running under tests."""

    def decorator(func: Callable) -> Callable:
        if _is_test_mode():
            return func
        return limiter.limit(limit_str)(func)

    return decorator


__all__ = [
    "limiter",
    "conditional_rate_limit",
    "RateLimitExceeded",
]
