import pytest

from recyclic_api.utils.financial_security import (
    encrypt_string,
    decrypt_string,
    encrypt_numeric,
    decrypt_numeric,
    FinancialDataError,
)


def test_encrypt_decrypt_string_roundtrip():
    secret = 'confidential-data-123'
    token = encrypt_string(secret)
    assert isinstance(token, str)
    assert token != secret
    assert decrypt_string(token) == secret


def test_decrypt_string_with_invalid_token_raises():
    with pytest.raises(FinancialDataError):
        decrypt_string('not-a-valid-token')


def test_encrypt_numeric_helpers():
    token = encrypt_numeric(42.5)
    value = decrypt_numeric(token, cast_type=float)
    assert pytest.approx(value) == 42.5

    token_int = encrypt_numeric(12)
    value_int = decrypt_numeric(token_int, cast_type=int)
    assert value_int == 12
