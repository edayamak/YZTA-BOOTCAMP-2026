from catboost import CatBoostClassifier

from app.config import MODEL_DIR
from app.schemas.predict import AnomalyInput, AnomalyResult, ChurnResult, SessionInput
from app.services.feature_extraction import extract_anomaly_features, extract_churn_features


class MLService:
    def __init__(self) -> None:
        self.anomaly_model = CatBoostClassifier()
        self.churn_model = CatBoostClassifier()
        self.ready = False
        self._load_models()

    def _load_models(self) -> None:
        anomaly_path = MODEL_DIR / "anomaly_model.cbm"
        churn_path = MODEL_DIR / "churn_model.cbm"

        if not anomaly_path.exists() or not churn_path.exists():
            return

        try:
            self.anomaly_model.load_model(str(anomaly_path))
            self.churn_model.load_model(str(churn_path))
            self.ready = True
        except Exception:
            self.ready = False

    def predict_anomaly(self, data: AnomalyInput) -> AnomalyResult:
        features = extract_anomaly_features(data)
        proba = float(self.anomaly_model.predict_proba([features])[0][1])
        return AnomalyResult(
            anomaly_score=round(proba, 4),
            is_anomaly=bool(proba >= 0.5),
            risk_level="HIGH" if proba >= 0.7 else "MEDIUM" if proba >= 0.4 else "LOW",
        )

    def predict_churn(self, data: SessionInput) -> ChurnResult:
        features = extract_churn_features(data)
        proba = float(self.churn_model.predict_proba([features])[0][1])
        ux_score = round((1 - proba) * 100, 1)
        return ChurnResult(
            churn_risk=round(proba, 4),
            ux_score=ux_score,
            will_churn=bool(proba >= 0.5),
            ux_label="IYI" if ux_score >= 70 else "ORTA" if ux_score >= 40 else "KOTU",
        )


ml_service = MLService()
