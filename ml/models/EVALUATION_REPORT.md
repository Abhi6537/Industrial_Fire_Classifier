# NASA FIRMS Satellite Classifier — Model Evaluation Benchmark

> **Validation Date**: 2026-09-09
> **Dataset Origin**: `data/training/real_firms_viirs_india_12m.csv` (728 NASA VIIRS satellite observations)
> **Architecture**: Random Forest Classifier (Balanced Sample Weights)

## 1. Classification Performance (Held-Out Real Satellite Test Split)

```
                      precision    recall  f1-score   support

   agricultural_burn       0.55      0.44      0.49        27
     industrial_fire       1.00      1.00      1.00         1
     mining_activity       0.86      0.90      0.88       103
        normal_flare       1.00      1.00      1.00        11
unregistered_anomaly       1.00      1.00      1.00         1
            wildfire       1.00      1.00      1.00         3

            accuracy                           0.83       146
           macro avg       0.90      0.89      0.90       146
        weighted avg       0.82      0.83      0.82       146

```

## 2. Key Operational Metrics

- **Industrial Fire Recall**: 100.0%
- **Normal Flare Precision**: 100.0%
- **Macro F1-Score**: 89.5%

## 3. Feature Attribution Ranking

- `land_cover_encoded`: 26.56%
- `deviation_score`: 15.71%
- `brightness_temp`: 14.28%
- `frp`: 12.95%
- `persistence_count`: 8.96%
- `on_known_site`: 8.13%
- `site_type_encoded`: 6.97%
- `confidence_numeric`: 4.63%
- `is_first_detection`: 1.81%
- `hour_of_day`: 0.00%
- `day_of_week`: 0.00%
