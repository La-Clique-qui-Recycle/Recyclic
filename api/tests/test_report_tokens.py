import time

from recyclic_api.utils.report_tokens import generate_download_token, verify_download_token


def test_generate_download_token_valid(monkeypatch):
    monkeypatch.setattr('recyclic_api.utils.report_tokens.time.time', lambda: 1_700_000_000)
    token = generate_download_token('report.csv', ttl_seconds=300)
    assert verify_download_token(token, 'report.csv')
    assert not verify_download_token(token, 'other.csv')


def test_download_token_expired(monkeypatch):
    start = 1_700_000_000

    monkeypatch.setattr('recyclic_api.utils.report_tokens.time.time', lambda: start)
    token = generate_download_token('report.csv', ttl_seconds=60)

    monkeypatch.setattr('recyclic_api.utils.report_tokens.time.time', lambda: start + 120)
    assert not verify_download_token(token, 'report.csv')
