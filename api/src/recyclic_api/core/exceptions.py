"""
Custom exceptions for the Recyclic API
"""

class RecyclicException(Exception):
    """Base exception for Recyclic API"""
    pass

class NotFoundError(RecyclicException):
    """Raised when a resource is not found"""
    pass

class ValidationError(RecyclicException):
    """Raised when validation fails"""
    pass

class AuthenticationError(RecyclicException):
    """Raised when authentication fails"""
    pass

class AuthorizationError(RecyclicException):
    """Raised when authorization fails"""
    pass

class DatabaseError(RecyclicException):
    """Raised when database operations fail"""
    pass
