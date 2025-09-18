import importlib.util
from pathlib import Path

_real = Path(__file__).resolve().parents[2] / 'api' / 'migrations' / 'versions' / '3f67c2e8edc1_add_audio_support_to_deposits.py'
_spec = importlib.util.spec_from_file_location('real_3f67c2e8edc1', str(_real))
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)

for _name in dir(_mod):
    if not _name.startswith('_'):
        globals()[_name] = getattr(_mod, _name)
