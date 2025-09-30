import os
import sqlalchemy as sa
from sqlalchemy import create_engine


def test_reception_tables_and_seed_exist():
    db_url = os.getenv("TEST_DATABASE_URL", os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"))
    engine = create_engine(db_url)
    with engine.connect() as conn:
        # Tables
        expected = [
            "dom_category",
            "dom_category_closure",
            "poste_reception",
            "ticket_depot",
            "ligne_depot",
        ]
        for table in expected:
            res = conn.execute(sa.text("SELECT to_regclass(:t)"), {"t": table}).scalar()
            assert res == table, f"Table manquante: {table}"

        # Seed
        cnt = conn.execute(sa.text("SELECT COUNT(*) FROM dom_category")).scalar()
        assert cnt and cnt >= 14, f"Seed L1 attendu >=14, obtenu {cnt}"
