# SCT_ML_1 — House Price Prediction Web App

**SkillCraft Technology | Machine Learning Internship | Task 1**

A full-stack web application that predicts house sale prices using a Linear Regression model trained on the Ames Housing Dataset.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML Model | scikit-learn (Linear Regression) |
| Backend | Python + Flask REST API |
| Frontend | React 18 |
| Styling | Pure CSS (dark theme) |

---

## Project Structure

```
SCT_ML_1_webapp/
├── backend/
│   ├── app.py          # Flask API — trains model & serves predictions
│   └── train.csv       # Ames Housing training dataset
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js      # Main React component
    │   ├── App.css     # Styles
    │   └── index.js    # Entry point
    └── package.json
```

---

## Features

- Interactive sliders for property inputs (living area, basement, bedrooms, bathrooms)
- Real-time predicted house price display
- Model performance stats (R², MAE)
- Feature importance bar chart
- Property summary card

---

## Model Details

**Features used:**
- `GrLivArea` — Above-ground living area (sq ft)
- `TotalBsmtSF` — Total basement area (sq ft)
- `BedroomAbvGr` — Bedrooms above grade
- `FullBath` — Full bathrooms above grade
- `HalfBath` — Half bathrooms above grade

**Performance (Validation Set — 20%):**
| Metric | Value |
|--------|-------|
| R² Score | 72.50% |
| MAE | $30,693 |
| RMSE | $45,929 |

---

## How to Run

### 1. Backend (Flask)

```bash
cd backend
pip install flask flask-cors scikit-learn pandas numpy
python app.py
```

Flask will start on `http://localhost:5000`

### 2. Frontend (React)

```bash
cd frontend
npm install
npm start
```

React will open on `http://localhost:3000`

> Make sure both are running simultaneously.

---

## Dataset

[Kaggle — House Prices: Advanced Regression Techniques](https://www.kaggle.com/competitions/house-prices-advanced-regression-techniques/data)

---

*SkillCraft Technology · Machine Learning Internship · June 2026*
