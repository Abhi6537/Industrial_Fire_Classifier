"""
Model Training & Evaluation Pipeline
Trains gradient-boosted / random forest classifier on enriched satellite features.
Evaluates on a held-out test set and saves serialized artifacts to ml/models/.
"""

import os
import sys
import logging
from datetime import datetime, timezone
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score, recall_score, precision_score

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.features import FeatureExtractor, FEATURE_COLUMNS, LABEL_CLASSES
from ml.dataset_generator import generate_benchmark_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("train_model")

# Check for xgboost availability
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False


def train_classifier(
    dataset_df: pd.DataFrame = None,
    output_dir: str = "ml/models",
    test_size: float = 0.2,
    random_state: int = 42,
):
    """
    Executes offline model training, held-out evaluation, and artifact serialization.
    """
    os.makedirs(output_dir, exist_ok=True)
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    logger.info("=" * 70)
    logger.info(f"STARTING MODEL TRAINING PIPELINE — {today_str}")
    logger.info("=" * 70)

    # 1. Acquire benchmark dataset
    if dataset_df is None or dataset_df.empty:
        logger.info("Generating weak-labeled benchmark dataset...")
        dataset_df = generate_benchmark_dataset(samples_per_class=300, seed=random_state)

    # 2. Extract feature matrix X and target y
    logger.info("Extracting feature matrix X and label vector y...")
    X, y_raw = FeatureExtractor.prepare_training_data(dataset_df)

    # 3. Encode labels
    encoder = LabelEncoder()
    # Fit encoder on predefined label classes to guarantee deterministic ordering
    encoder.fit(LABEL_CLASSES)
    y = encoder.transform(y_raw)

    # 4. Stratified Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    logger.info(f"Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 5. Model Instantiation
    if HAS_XGBOOST:
        logger.info("Selected Primary Engine: XGBoost Classifier (XGBClassifier)")
        # Calculate sample weights for class balance
        from sklearn.utils.class_weight import compute_sample_weight
        sample_weights = compute_sample_weight("balanced", y_train)

        model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            objective="multi:softprob",
            random_state=random_state,
            eval_metric="mlogloss",
        )
        model.fit(X_train, y_train, sample_weight=sample_weights)
    else:
        logger.info("Selected Engine: Scikit-Learn Balanced Random Forest Classifier")
        model = RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)

    # 6. Evaluation on Held-Out Test Set
    y_pred = model.predict(X_test)
    report_dict = classification_report(
        y_test, y_pred, target_names=encoder.classes_, output_dict=True
    )
    report_text = classification_report(y_test, y_pred, target_names=encoder.classes_)

    logger.info("\n" + "=" * 70)
    logger.info(f"EVALUATION METRICS — Measured on test set ({today_str}):")
    logger.info("=" * 70)
    print(report_text)

    # 7. Check Operational Performance Targets
    ind_fire_recall = report_dict["industrial_fire"]["recall"]
    normal_flare_prec = report_dict["normal_flare"]["precision"]
    macro_f1 = report_dict["macro avg"]["f1-score"]

    logger.info("-" * 70)
    logger.info("Operational Target Validation:")
    logger.info(f"• industrial_fire recall:   {ind_fire_recall:.3f} (Target > 0.80) -> {'PASS' if ind_fire_recall >= 0.80 else 'FAIL'}")
    logger.info(f"• normal_flare precision:   {normal_flare_prec:.3f} (Target > 0.90) -> {'PASS' if normal_flare_prec >= 0.90 else 'FAIL'}")
    logger.info(f"• Macro F1-score:           {macro_f1:.3f} (Target > 0.75) -> {'PASS' if macro_f1 >= 0.75 else 'FAIL'}")
    logger.info("-" * 70)

    # 8. Feature Importances
    if hasattr(model, "feature_importances_"):
        importances = pd.Series(model.feature_importances_, index=FEATURE_COLUMNS).sort_values(ascending=False)
        logger.info("Top Feature Importances:")
        for feat, imp in importances.items():
            logger.info(f"  - {feat:20s}: {imp * 100:5.2f}%")

    # 9. Artifact Serialization
    model_path = os.path.join(output_dir, "model.pkl")
    encoder_path = os.path.join(output_dir, "encoder.pkl")

    joblib.dump(model, model_path)
    joblib.dump(encoder, encoder_path)
    logger.info(f"Serialized model saved to: {model_path}")
    logger.info(f"Serialized encoder saved to: {encoder_path}")

    return model, encoder, report_dict


if __name__ == "__main__":
    train_classifier()
