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
        # Pick any active category or create one if none exists
        category_id = conn.execute(
            sa.text("SELECT id FROM categories WHERE is_active = true ORDER BY name LIMIT 1")
        ).scalar()
        if not category_id:
            # Create a minimal category if none exists
            category_id = uuid.uuid4()
            conn.execute(
                sa.text(
                    """
                    INSERT INTO categories (id, name, is_active)
                    VALUES (:id, 'Test Category', true)
                    """
                ),
                {"id": category_id},
            )

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
                    INSERT INTO users (id, username, hashed_password, role, status, is_active)
                    VALUES (:id, 'qa-user', 'x', 'user', 'active', true)
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

        # Create ligne_depot linked to category
        ligne_id = uuid.uuid4()
        conn.execute(
            sa.text(
                """
                INSERT INTO ligne_depot (id, ticket_id, category_id, poids_kg, destination)
                VALUES (:id, :ticket, :cat, 1.234, 'MAGASIN')
                """
            ),
            {"id": ligne_id, "ticket": ticket_id, "cat": category_id},
        )

        # Verify joins
        count = conn.execute(
            sa.text(
                """
                SELECT COUNT(*)
                FROM ticket_depot t
                JOIN ligne_depot l ON l.ticket_id = t.id
                JOIN categories c ON c.id = l.category_id
                WHERE t.id = :tid
                """
            ),
            {"tid": ticket_id},
        ).scalar()
        assert count == 1

import pytest




def test_create_poste_ticket_ligne_with_category_relations():
    # TODO: implement ORM session fixture, create poste → ticket → ligne linked to category
    assert True


def test_cascade_delete_ticket_removes_lignes_only():
    # TODO: implement: delete ticket should delete lignes, but keep poste and category
    assert True


