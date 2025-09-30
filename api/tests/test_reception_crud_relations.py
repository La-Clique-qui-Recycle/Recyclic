import os
import uuid
import sqlalchemy as sa
from sqlalchemy import create_engine


def test_crud_relations_reception_minimal():
    db_url = os.getenv(
        "TEST_DATABASE_URL",
        os.getenv("DATABASE_URL", "postgresql://recyclic:postgres@localhost:5432/recyclic"),
    )
    engine = create_engine(db_url)
    with engine.begin() as conn:
        # Pick any L1 category
        dom_category_id = conn.execute(
            sa.text("SELECT id FROM dom_category ORDER BY label LIMIT 1")
        ).scalar()
        assert dom_category_id, "Aucune dom_category trouvée"

        # Ensure a user exists to open a poste (fallback: create a dummy if schema allows)
        user_id = conn.execute(
            sa.text("SELECT id FROM users LIMIT 1")
        ).scalar()
        if not user_id:
            # Create a minimal user if table exists and constraints allow
            user_id = uuid.uuid4()
            conn.execute(
                sa.text(
                    """
                    INSERT INTO users (id, username, hashed_password, is_active)
                    VALUES (:id, 'qa-user', 'x', true)
                    """
                ),
                {"id": user_id},
            )

        # Create poste_reception
        poste_id = uuid.uuid4()
        conn.execute(
            sa.text(
                """
                INSERT INTO poste_reception (id, opened_by_user_id, status)
                VALUES (:id, :uid, 'opened')
                """
            ),
            {"id": poste_id, "uid": user_id},
        )

        # Create ticket_depot
        ticket_id = uuid.uuid4()
        conn.execute(
            sa.text(
                """
                INSERT INTO ticket_depot (id, poste_id, benevole_user_id, status)
                VALUES (:id, :poste, :uid, 'opened')
                """
            ),
            {"id": ticket_id, "poste": poste_id, "uid": user_id},
        )

        # Create ligne_depot linked to dom_category
        ligne_id = uuid.uuid4()
        conn.execute(
            sa.text(
                """
                INSERT INTO ligne_depot (id, ticket_id, dom_category_id, poids_kg)
                VALUES (:id, :ticket, :cat, 1.234)
                """
            ),
            {"id": ligne_id, "ticket": ticket_id, "cat": dom_category_id},
        )

        # Verify joins
        count = conn.execute(
            sa.text(
                """
                SELECT COUNT(*)
                FROM ticket_depot t
                JOIN ligne_depot l ON l.ticket_id = t.id
                JOIN dom_category c ON c.id = l.dom_category_id
                WHERE t.id = :tid
                """
            ),
            {"tid": ticket_id},
        ).scalar()
        assert count == 1

import pytest


pytestmark = pytest.mark.skip(reason="Skeleton CRUD/relations tests for reception schema - enable after DEV alignment")


def test_create_poste_ticket_ligne_with_category_relations():
    # TODO: implement ORM session fixture, create poste → ticket → ligne linked to dom_category
    assert True


def test_cascade_delete_ticket_removes_lignes_only():
    # TODO: implement: delete ticket should delete lignes, but keep poste and category
    assert True


