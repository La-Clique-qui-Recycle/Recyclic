import importlib.util
from pathlib import Path

_real = Path(__file__).resolve().parents[2] / 'api' / 'migrations' / 'versions' / '06c4a1b70fde_refactor_set_user_login_to_username.py'
_spec = importlib.util.spec_from_file_location('real_06c4a1b70fde', str(_real))
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)

for _name in dir(_mod):
    if not _name.startswith('_'):
        globals()[_name] = getattr(_mod, _name)
