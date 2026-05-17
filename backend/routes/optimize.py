from fastapi import APIRouter, HTTPException
from models.schemas import OptimizationInput, OptimizationResponse
from engine.heuristic import run_heuristic_optimization
from engine.advanced_scorer import run_advanced_optimization

router = APIRouter(prefix="/optimize", tags=["optimization"])

@router.post("/", response_model=OptimizationResponse)
def optimize_packaging(data: OptimizationInput):
    """
    Run the PackVision ML-Scorer optimization engine.
    This replaces the Node.js heuristic logic for higher performance and ML readiness.
    """
    try:
        if not data.available_boxes:
            raise HTTPException(status_code=400, detail="No available boxes provided.")
            
        try:
            result = run_advanced_optimization(data)
            return result
        except Exception as e_adv:
            print(f"Advanced scorer failed: {e_adv}. Falling back to heuristic.")
            result = run_heuristic_optimization(data)
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
