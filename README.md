# SCT_ML_1 — House Price Prediction Web App

**SkillCraft Technology | Machine Learning Internship | Task 1**

A full-stack web application that predicts house sale prices using a Linear Regression model trained on the Ames Housing Dataset. Built with a React frontend and Flask REST API backend.

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
SCT_ML_1/
├── backend/
│   ├── app.py          # Flask API — trains model & serves predictions
│   └── train.csv       # Ames Housing training dataset
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   ├── App.css     # Styles
│   │   └── index.js    # Entry point
│   └── package.json
├── .gitignore
└── README.md
```

---

## Features

- 🎚️ **Interactive sliders** — adjust living area, basement, bedrooms, and bathrooms
- ⚡ **Live price prediction** — updates instantly as you move sliders (no button needed)
- 📊 **Model stats** — R² accuracy and MAE displayed at the top
- 💡 **Price Breakdown** — live bars showing each feature's ₹ contribution to the current price
- 🚀 **Boost Value** — smart tips showing how much value each improvement adds (e.g. +100 sq ft → +₹X)
- 🏦 **EMI Estimator** — mortgage calculator with down payment, interest rate, and tenure sliders
- 📈 **Market Distribution** — histogram of dataset prices with your property highlighted
- 🏘️ **Neighbourhood Comparison** — top 10 neighbourhoods by average price
- 🎯 **Gauge** — shows how your property compares vs the dataset average
- 💰 **Price in INR** — all prices displayed in Indian Rupees (₹)

---

## Model Details

**Features used:**
| Column | Description |
|--------|-------------|
| `GrLivArea` | Above-ground living area (sq ft) |
| `TotalBsmtSF` | Total basement area (sq ft) |
| `BedroomAbvGr` | Bedrooms above grade |
| `FullBath` | Full bathrooms above grade |
| `HalfBath` | Half bathrooms above grade |

**Target:** `SalePrice` (converted to INR at ₹83.5/USD)

**Performance (Validation Set — 20% of 1,460 samples):**
| Metric | Value |
|--------|-------|
| R² Score | 72.50% |
| MAE | ₹25,62,865 |

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
npm install --legacy-peer-deps
npm start
```

React will open on `http://localhost:3000`

> ⚠️ Both terminals must stay running simultaneously.

---

## Dataset

[Kaggle — House Prices: Advanced Regression Techniques](https://www.kaggle.com/competitions/house-prices-advanced-regression-techniques/data)

- Training samples: 1,460
- Features: 81 columns
- Target: SalePrice

---

*SkillCraft Technology · Machine Learning Internship · June 2026*
