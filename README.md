# AGRI-INSIGHT (AgriNexus)
### Smart Agricultural Intelligence, Climate Analytics & Advisory Platform

AGRI-INSIGHT is a full-stack precision agriculture and climate intelligence platform. It integrates historical agro-climatic datasets, machine learning models (Random Forest regression, multi-output climate forecasting, balanced classifiers), and text mining pipelines to deliver actionable insights for farmers, researchers, and agronomists.

---

## ⚠️ Critical Security Notice: API Key Revocation

> **IMPORTANT:** If any API key was previously exposed or committed to source control in earlier revisions, you must immediately **revoke that key** in the [Google AI Studio Console](https://aistudio.google.com/app/apikey) and generate a new key.
>
> All credentials and secrets in AGRI-INSIGHT are now strictly managed through environment variables (`.env`). Real secret keys are never committed to version control.

---

## System Architecture

- **Backend**: FastAPI (Python 3.10+ / 3.13), Uvicorn, SQLite, SQLAlchemy.
- **Frontend**: React 18, Vite 7, TailwindCSS, Lucide React, Plotly (dist-min).
- **Machine Learning & Analytics**:
  - `yield_model.joblib`: Random Forest Regressor for crop yield prediction ($R^2 > 0.90$).
  - `weather_model.joblib`: Multi-Output Climate Regressor ($R^2 \approx 0.76$).
  - `fertilizer_model.pkl`: Classifier for customized NPK and chemical fertilizer recommendations.
  - `nlp_advisory_model.joblib`: TF-IDF Multinomial Naive Bayes query triage model.
  - `nlp_sentiment_model.joblib`: Balanced Logistic Regression market sentiment pipeline.
- **External Services**: Open-Meteo Weather API (with explicit simulated fallback telemetry) and Google Gemini Generative AI (optional, streaming advisory).

---

## Prerequisites

1. **Python**: 3.10 or higher (Python 3.13 supported).
2. **Node.js**: v18.0.0 or higher (v20+ recommended) and `npm`.
3. **Git**: Installed and configured.

---

## Installation & Setup

### 1. Clone & Set Up Backend

```bash
# Clone the repository
git clone https://github.com/Hemzz4/Agri-Nexus.git
cd Agri-Nexus

# Create and activate Python virtual environment
# Windows (PowerShell):
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Windows (Command Prompt):
.\.venv\Scripts\activate.bat

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the template configuration file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```dotenv
# Google Gemini API Key (Obtain from https://aistudio.google.com/)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# JWT Secret Key for Session Authentication (minimum 32 random characters)
JWT_SECRET_KEY=generate_a_secure_random_32_character_string_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Environment mode: 'development' or 'production'
# In production, the backend will refuse to start if JWT_SECRET_KEY is missing or insecure.
ENVIRONMENT=development

# OpenBLAS thread safety on Windows (prevents memory allocation error)
OPENBLAS_NUM_THREADS=1
```

---

## Machine Learning Models & Training

All 8 pre-trained model artifacts are tracked directly in the repository for immediate out-of-the-box execution:
- `backend/ml/yield_model.joblib`
- `backend/ml/weather_model.joblib`
- `backend/ml/nlp_advisory_model.joblib`
- `backend/ml/nlp_sentiment_model.joblib`
- `backend/ml/models/fertilizer_model.pkl`
- `backend/ml/models/soil_encoder.pkl`
- `backend/ml/models/crop_encoder.pkl`
- `backend/ml/models/fertilizer_encoder.pkl`

You can also re-train the models at any time using the portable training scripts:

```bash
# 1. Train Crop Yield & Multi-Output Climate Models
python backend/ml/train_model.py

# 2. Train Fertilizer Recommendation Classifier & Label Encoders
python backend/ml/train_fertilizer.py

# 3. Train NLP Farmer Query Diagnosis Classifier
python backend/ml/train_nlp_advisory.py

# 4. Train NLP Market Sentiment Classifier
python backend/ml/train_nlp_sentiment.py
```

---

## Running the Application

### Start Backend API Server
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### Start Frontend Application
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Running Verification Tests

Run the comprehensive integration test suite verifying all 7 security, ML, fallback, and ranking features:

```bash
python test_suite.py
```

Run Table 4 evaluation protocol metrics calculation:
```bash
python compute_table4_values.py
```

---

## Key Methodologies & Reliability Features

### 1. Empirical Bayes Crop Recommendation Safeguards
To prevent rare crops with limited sample sizes ($n=1$ or $n=2$) from dominating rankings through unweighted yield outliers:
- **Minimum Observation Threshold**: Crops with fewer than 3 regional observations are penalized.
- **Empirical Bayes Shrinkage**: Yield scores are shrunken toward the regional mean:
  $$w_i = \frac{n_i}{n_i + K} \quad (K = 3.0)$$
  $$\text{Adjusted Yield}_i = w_i \cdot \bar{Y}_i + (1 - w_i) \cdot \mu_{\text{region}}$$
- **Confidence Badging**: Every recommendation provides `confidence_level` (`High`, `Moderate`, `Low`) and a transparent observation note in the API and UI.

### 2. Weather Fallback Transparency
If the Open-Meteo external API is unreachable or rate-limited:
- Responses explicitly return `is_simulated: true`, `data_source: "simulated_fallback"`, and a descriptive warning.
- The frontend renders an amber alert banner notifying the user that live sensor readings could not be retrieved and historical seasonal baselines are currently displayed.

### 3. Synthetic NLP Dataset Disclosures
The farmer advisory and news datasets contain template-generated synthetic texts. The training pipelines transparently log duplicate density and report both raw and deduplicated partition metrics so evaluations do not rely on memorization artifacts.
