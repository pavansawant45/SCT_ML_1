"""
SCT_ML_1 - House Price Prediction Backend
Flask API that trains a Linear Regression model and serves predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
import os

app = Flask(__name__)
CORS(app)

FEATURES     = ["GrLivArea", "TotalBsmtSF", "BedroomAbvGr", "FullBath", "HalfBath"]
USD_TO_INR   = 83.5

# ── Global state ───────────────────────────────────────────────────────────────
model        = None
scaler       = None
model_stats  = None
df_global    = None

def train_model():
    global df_global
    csv_path  = os.path.join(os.path.dirname(__file__), "train.csv")
    df        = pd.read_csv(csv_path)
    df_global = df

    X = df[FEATURES]
    y = df["SalePrice"]

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    sc = StandardScaler()
    X_train_sc = sc.fit_transform(X_train)
    X_val_sc   = sc.transform(X_val)

    mdl = LinearRegression()
    mdl.fit(X_train_sc, y_train)

    y_pred = mdl.predict(X_val_sc)
    r2  = r2_score(y_val, y_pred)
    mae = mean_absolute_error(y_val, y_pred)

    # Price distribution buckets for histogram
    bins   = [0, 50, 100, 150, 200, 250, 300, 400, 500, 1000]
    labels = ["<50L","50-100L","1-1.5Cr","1.5-2Cr","2-2.5Cr","2.5-3Cr","3-4Cr","4-5Cr","5Cr+"]
    prices_inr = (y * USD_TO_INR / 100000)
    buckets = pd.cut(prices_inr, bins=bins, labels=labels).value_counts().reindex(labels).fillna(0)

    # Neighbourhood avg prices (top 10)
    neigh = (df.groupby("Neighborhood")["SalePrice"].mean() * USD_TO_INR)\
              .sort_values(ascending=False).head(10).round().astype(int)

    stats = {
        "r2"         : round(r2 * 100, 2),
        "mae"        : round(mae * USD_TO_INR),
        "mean_price" : round(y.mean() * USD_TO_INR),
        "min_price"  : round(y.min()  * USD_TO_INR),
        "max_price"  : round(y.max()  * USD_TO_INR),
        "train_size" : len(df),
        "coefficients": {
            feat: round(float(coef), 2)
            for feat, coef in zip(FEATURES, mdl.coef_)
        },
        "price_distribution": {
            "labels": labels,
            "counts": buckets.tolist()
        },
        "neighborhood_avg": {
            "labels": neigh.index.tolist(),
            "values": neigh.values.tolist()
        },
        "scaler_mean" : sc.mean_.tolist(),
        "scaler_std"  : sc.scale_.tolist(),
    }
    return mdl, sc, stats

print("Training model...")
model, scaler, model_stats = train_model()
print(f"Model ready — R² = {model_stats['r2']}%")


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data          = request.get_json()
        gr_liv_area   = float(data.get("grLivArea",   0))
        total_bsmt_sf = float(data.get("totalBsmtSF", 0))
        bedrooms      = float(data.get("bedrooms",    0))
        full_bath     = float(data.get("fullBath",    0))
        half_bath     = float(data.get("halfBath",    0))

        raw      = np.array([[gr_liv_area, total_bsmt_sf, bedrooms, full_bath, half_bath]])
        scaled   = scaler.transform(raw)
        base_pred = float(model.predict(scaled)[0])

        # Per-feature contribution (coef * scaled_value * USD_TO_INR)
        contributions = {
            feat: round(float(model.coef_[i]) * float(scaled[0][i]) * USD_TO_INR)
            for i, feat in enumerate(FEATURES)
        }

        # Confidence band ± 1 MAE
        mae_inr = model_stats["mae"]
        predicted_inr = round(base_pred * USD_TO_INR)

        # Price per sqft
        total_sqft    = gr_liv_area + total_bsmt_sf
        price_per_sqft = round((predicted_inr / total_sqft) if total_sqft > 0 else 0)

        # Compare to dataset mean
        mean_price    = model_stats["mean_price"]
        pct_vs_avg    = round(((predicted_inr - mean_price) / mean_price) * 100, 1)

        # Smart tips — suggest best improvement
        tips = []
        # +100 sqft living area
        raw2 = raw.copy(); raw2[0][0] += 100
        gain_area = round((float(model.predict(scaler.transform(raw2))[0]) - base_pred) * USD_TO_INR)
        tips.append({"action": "Add 100 sq ft living area", "gain": gain_area})
        # +1 full bath
        raw3 = raw.copy(); raw3[0][3] += 1
        gain_bath = round((float(model.predict(scaler.transform(raw3))[0]) - base_pred) * USD_TO_INR)
        tips.append({"action": "Add 1 full bathroom", "gain": gain_bath})
        # +100 sqft basement
        raw4 = raw.copy(); raw4[0][1] += 100
        gain_bsmt = round((float(model.predict(scaler.transform(raw4))[0]) - base_pred) * USD_TO_INR)
        tips.append({"action": "Add 100 sq ft basement", "gain": gain_bsmt})

        return jsonify({
            "predicted_price" : predicted_inr,
            "price_low"       : predicted_inr - mae_inr,
            "price_high"      : predicted_inr + mae_inr,
            "price_per_sqft"  : price_per_sqft,
            "pct_vs_avg"      : pct_vs_avg,
            "contributions"   : contributions,
            "tips"            : tips,
            "success"         : True
        })
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 400


@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify(model_stats)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
