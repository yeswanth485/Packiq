from fastapi import APIRouter, HTTPException
from models.schemas import OptimizationInput, OptimizationResponse
from engine.heuristic import run_heuristic_optimization
from engine.advanced_scorer import run_advanced_optimization
from engine.xgboost_engine import run_xgboost_optimization

router = APIRouter(prefix="/optimize", tags=["optimization"])

@router.post("/", response_model=OptimizationResponse)
def optimize_packaging(data: OptimizationInput):
    """
    Run the PackVision ML-Scorer optimization engine.
    This uses the XGBoost engine for higher performance and ML readiness.
    """
    try:
        if not data.available_boxes:
            raise HTTPException(status_code=400, detail="No available boxes provided.")
            
        try:
            # Prioritize XGBoost Engine
            result = run_xgboost_optimization(data)
            return result
        except Exception as e_xgb:
            print(f"XGBoost engine failed: {e_xgb}. Falling back to advanced scorer.")
            try:
                result = run_advanced_optimization(data)
                return result
            except Exception as e_adv:
                print(f"Advanced scorer failed: {e_adv}. Falling back to heuristic.")
                result = run_heuristic_optimization(data)
                return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
