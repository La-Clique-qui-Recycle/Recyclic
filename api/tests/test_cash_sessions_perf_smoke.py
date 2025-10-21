import os
import time
from datetime import datetime, timedelta, timezone


def test_cash_sessions_list_p95_smoke(admin_client):
    if os.getenv('RECYC_PERF_SMOKE', '0') != '1':
        import pytest
        pytest.skip('perf smoke disabled')

    # simple smoke: 20 calls to list within a date window
    params = {
        'date_from': (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
        'date_to': datetime.now(timezone.utc).isoformat(),
    }
    durations = []
    for _ in range(20):
        t0 = time.perf_counter()
        r = admin_client.get('/v1/cash-sessions/', params=params)
        t1 = time.perf_counter()
        assert r.status_code == 200
        durations.append((t1 - t0) * 1000.0)

    durations.sort()
    p95 = durations[int(len(durations) * 0.95) - 1]
    # advisory threshold
    assert p95 < 500.0, f'p95 {p95:.1f}ms exceeds 500ms threshold'








