from fastapi import APIRouter

router = APIRouter(tags=["test-auth"])

@router.get("/test")
async def test_auth():
    """Test simple pour vérifier que l'endpoint fonctionne"""
    return {"message": "Auth endpoint working"}
