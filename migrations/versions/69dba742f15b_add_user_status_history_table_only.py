import importlib.util
from pathlib import Path

_real = Path(__file__).resolve().parents[2] / 'api' / 'migrations' / 'versions' / '69dba742f15b_add_user_status_history_table_only.py'
_spec = importlib.util.spec_from_file_location('real_69dba742f15b', str(_real))
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)

for _name in dir(_mod):
    if not _name.startswith('_'):
        globals()[_name] = getattr(_mod, _name)
