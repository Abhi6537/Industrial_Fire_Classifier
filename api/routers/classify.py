"""
Real-Time Model Classification & Explainability Endpoint
Runs live inference and explainability on ad-hoc or incoming satellite observations.
"""

from fastapi import APIRouter, Depends
import pandas as pd

from api.models.event import ClassifyRequest, ClassifiedEventResponse
from api.auth import get_current_user, User
from api.database import db
from ml.predict import ClassifierService

router = APIRouter(prefix="/classify", tags=["Model Inference"])

# Singleton classifier service instance
classifier = ClassifierService()


@router.post("", response_model=ClassifiedEventResponse)
def classify_detection(
    payload: ClassifyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Submits a hotspot observation for real-time XGBoost classification and SHAP explainability.
    """
    input_df = pd.DataFrame([payload.model_dump()])
    classified_df = classifier.predict_detections(input_df)
    res_row = classified_df.iloc[0].to_dict()

    event_id = f"evt-adhoc-{int(pd.Timestamp.now().timestamp())}"
    res_row["id"] = event_id
    res_row["classified_at"] = pd.Timestamp.now(tz="UTC").isoformat()

    # Log action to audit trail
    db.log_analyst_action(
        event_id=event_id,
        analyst_id=current_user.email,
        action="INFERENCE_QUERY",
        note=f"Ad-hoc classification: {res_row['label']} ({res_row['confidence'] * 100:.1f}%)",
    )

    return res_row
