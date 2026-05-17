from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["system"])

@router.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "PackVision AI Engine",
        "version": "1.0.0"
    }
