# Model Classification Reports

This document contains the classification reports and performance metrics for the machine learning models embedded in the AGRI-DASH framework.

---

### 1. Fertilizer Recommendation Model (Random Forest Classifier)
The fertilizer model takes NPK values, environmental factors, and soil metadata to recommend the optimal fertilizer compound.

**Model Characteristics:**
- **Algorithm:** Random Forest Classifier (100 estimators)
- **Input Features:** Temperature, Humidity, Moisture, Soil_Type, Crop_Type, Nitrogen, Potassium, Phosphorus
- **Target Variable:** Fertilizer 

**Classification Report:**
```text
               precision    recall  f1-score   support

           0       0.15      0.14      0.15       241
           1       0.16      0.16      0.16       241
           2       0.11      0.13      0.12       215
           3       0.14      0.12      0.13       236
           4       0.11      0.11      0.11       219
           5       0.16      0.15      0.15       239
           6       0.13      0.16      0.14       209

    accuracy                           0.14      1600
   macro avg       0.14      0.14      0.14      1600
weighted avg       0.14      0.14      0.14      1600
```
*Note: This specific training run reflects baseline initialization hyperparameters.*

---
