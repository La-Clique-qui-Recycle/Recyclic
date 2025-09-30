import pytest


pytestmark = pytest.mark.skip(reason="Skeleton CRUD/relations tests for reception schema - enable after DEV alignment")


def test_create_poste_ticket_ligne_with_category_relations():
    # TODO: implement ORM session fixture, create poste → ticket → ligne linked to dom_category
    assert True


def test_cascade_delete_ticket_removes_lignes_only():
    # TODO: implement: delete ticket should delete lignes, but keep poste and category
    assert True


