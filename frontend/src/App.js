import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtShort = (n) => {
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (Math.abs(n) >= 100000)  return `₹${(n / 100000).toFixed(1)}L`;
  return fmt(n);
};

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target, duration = 600) {
  const [val, setVal] = useState(target);
  const ref           = useRef(target);
  useEffect(() => {
    const start    = ref.current;
    const diff     = target - start;
    const steps    = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setVal(Math.round(start + diff * (step / steps)));
      if (step >= steps) { clearInterval(timer); ref.current = target; }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ── Gauge component ───────────────────────────────────────────────────────────
function Gauge({ pct }) {
  const angle  = Math.min(Math.max((pct + 100) / 200, 0), 1) * 180;
  const r      = 54;
  const cx     = 70; const cy = 70;
  const toRad  = (deg) => (deg * Math.PI) / 180;
  const arcPt  = (deg) => ({
    x: cx + r * Math.cos(toRad(180 + deg)),
    y: cy + r * Math.sin(toRad(180 + deg)),
  });
  const start  = arcPt(0);
  const end    = arcPt(angle);
  const large  = angle > 180 ? 1 : 0;
  const color  = pct > 20 ? "#10b981" : pct > 0 ? "#f59e0b" : pct > -20 ? "#f97316" : "#ef4444";

  return (
    <svg viewBox="0 0 140 80" className="gauge-svg">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#2e3250" strokeWidth="10" strokeLinecap="round" />
      {angle > 0 && (
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize="14" fontWeight="800">
        {pct > 0 ? "+" : ""}{pct}%
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#8892a4" fontSize="7">vs avg home</text>
      <text x={cx - r - 2} y={cy + 16} textAnchor="middle" fill="#8892a4" fontSize="6">Cheap</text>
      <text x={cx + r + 2} y={cy + 16} textAnchor="middle" fill="#8892a4" fontSize="6">Premium</text>
    </svg>
  );
}

// ── EMI Calculator ────────────────────────────────────────────────────────────
function EMICalc({ price }) {
  const [rate,   setRate]   = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [down,   setDown]   = useState(20);

  const loanAmt = price * (1 - down / 100);
  const r       = rate / 12 / 100;
  const n       = tenure * 12;
  const emi     = r > 0 ? Math.round(loanAmt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)) : 0;
  const total   = emi * n;
  const interest= total - loanAmt;

  return (
    <div className="emi-card">
      <h3 className="section-label">🏦 EMI Estimator</h3>
      <div className="emi-result">
        <span className="emi-amount">{fmtShort(emi)}<span className="emi-mo">/mo</span></span>
        <span className="emi-sub">Total interest: {fmtShort(interest)}</span>
      </div>
      <div className="emi-sliders">
        <div className="emi-row">
          <span>Down Payment</span><span className="ev">{down}%</span>
          <input type="range" min={5} max={50} step={5} value={down} onChange={e => setDown(+e.target.value)} className="slider slim" />
        </div>
        <div className="emi-row">
          <span>Interest Rate</span><span className="ev">{rate}%</span>
          <input type="range" min={6} max={15} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} className="slider slim" />
        </div>
        <div className="emi-row">
          <span>Loan Tenure</span><span className="ev">{tenure} yrs</span>
          <input type="range" min={5} max={30} step={5} value={tenure} onChange={e => setTenure(+e.target.value)} className="slider slim" />
        </div>
      </div>
      <div className="emi-breakdown">
        <div className="emi-bar-wrap">
          <div className="emi-bar-seg principal" style={{ width: `${(loanAmt / total) * 100}%` }} title="Principal" />
          <div className="emi-bar-seg interest-seg" style={{ width: `${(interest / total) * 100}%` }} title="Interest" />
        </div>
        <div className="emi-legend">
          <span><span className="dot principal-dot" />Principal {fmtShort(loanAmt)}</span>
          <span><span className="dot interest-dot" />Interest {fmtShort(interest)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Price Distribution Bar Chart ──────────────────────────────────────────────
function DistributionChart({ data, currentPrice }) {
  if (!data) return null;
  const max    = Math.max(...data.counts);
  const curBin = currentPrice ? (() => {
    const l = currentPrice / 100000;
    if (l < 50)  return 0;
    if (l < 100) return 1;
    if (l < 150) return 2;
    if (l < 200) return 3;
    if (l < 250) return 4;
    if (l < 300) return 5;
    if (l < 400) return 6;
    if (l < 500) return 7;
    return 8;
  })() : -1;

  return (
    <div className="dist-chart">
      <h3 className="section-label">📊 Market Price Distribution</h3>
      <div className="dist-bars">
        {data.labels.map((label, i) => (
          <div key={i} className="dist-col">
            <div className="dist-bar-wrap">
              <div
                className={`dist-bar ${i === curBin ? "active" : ""}`}
                style={{ height: `${(data.counts[i] / max) * 100}%` }}
              />
            </div>
            <span className="dist-label">{label}</span>
          </div>
        ))}
      </div>
      {curBin >= 0 && (
        <p className="dist-note">▲ Your property falls in the <strong>{data.labels[curBin]}</strong> range</p>
      )}
    </div>
  );
}

// ── Neighbourhood Chart ────────────────────────────────────────────────────────
function NeighbourhoodChart({ data }) {
  if (!data) return null;
  const max = Math.max(...data.values);
  return (
    <div className="neigh-chart">
      <h3 className="section-label">🏘️ Top Neighbourhoods by Avg Price</h3>
      {data.labels.map((label, i) => (
        <div key={i} className="neigh-row">
          <span className="neigh-label">{label}</span>
          <div className="neigh-bar-wrap">
            <div className="neigh-bar" style={{ width: `${(data.values[i] / max) * 100}%` }} />
          </div>
          <span className="neigh-val">{fmtShort(data.values[i])}</span>
        </div>
      ))}
    </div>
  );
}

// ── Contribution Bars ─────────────────────────────────────────────────────────
function ContributionBars({ contributions }) {
  if (!contributions) return null;
  const labels = {
    GrLivArea: "Living Area", TotalBsmtSF: "Basement Area",
    BedroomAbvGr: "Bedrooms", FullBath: "Full Baths", HalfBath: "Half Baths",
  };
  const entries = Object.entries(contributions).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const max     = Math.max(...entries.map(([, v]) => Math.abs(v)));

  return (
    <div className="contrib-section">
      <h3 className="section-label">💡 Price Breakdown <span className="live-badge">LIVE</span></h3>
      <p className="contrib-sub">How each feature contributes to your current estimate</p>
      {entries.map(([feat, val]) => (
        <div key={feat} className="contrib-row">
          <span className="contrib-label">{labels[feat]}</span>
          <div className="contrib-bar-wrap">
            <div
              className={`contrib-bar ${val < 0 ? "neg" : "pos"}`}
              style={{ width: `${(Math.abs(val) / max) * 100}%` }}
            />
          </div>
          <span className={`contrib-val ${val < 0 ? "neg-txt" : "pos-txt"}`}>
            {val >= 0 ? "+" : ""}{fmtShort(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Tips ──────────────────────────────────────────────────────────────────────
function Tips({ tips }) {
  if (!tips?.length) return null;
  return (
    <div className="tips-section">
      <h3 className="section-label">🚀 Boost Your Value</h3>
      {tips.map((tip, i) => (
        <div key={i} className="tip-row">
          <span className="tip-action">{tip.action}</span>
          <span className="tip-gain">+{fmtShort(tip.gain)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Slider ────────────────────────────────────────────────────────────────────
function SliderInput({ label, name, min, max, step, value, onChange, unit, description }) {
  return (
    <div className="input-group">
      <div className="input-header">
        <label>{label}</label>
        <span className="input-value">{value.toLocaleString("en-IN")} {unit}</span>
      </div>
      <input type="range" name={name} min={min} max={max} step={step}
        value={value} onChange={onChange} className="slider" />
      <div className="slider-bounds">
        <span>{min.toLocaleString()} {unit}</span>
        <span className="input-desc">{description}</span>
        <span>{max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [inputs, setInputs] = useState({
    grLivArea: 1500, totalBsmtSF: 800, bedrooms: 3, fullBath: 2, halfBath: 0,
  });
  const [result,  setResult]  = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("breakdown");
  const debounceRef = useRef(null);

  const animatedPrice = useCountUp(result?.predicted_price ?? 0);

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(setStats)
      .catch(() => setError("Cannot connect to Flask backend on port 5000."));
  }, []);

  const predict = useCallback(async (inp) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inp),
      });
      const data = await res.json();
      if (data.success) { setResult(data); setError(null); }
      else setError(data.error);
    } catch { setError("Backend not reachable."); }
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    const next = { ...inputs, [e.target.name]: Number(e.target.value) };
    setInputs(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => predict(next), 400);
  };

  const totalSqFt  = inputs.grLivArea + inputs.totalBsmtSF;
  const totalBaths = inputs.fullBath + inputs.halfBath * 0.5;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🏡</div>
            <div>
              <h1>HousePredict</h1>
              <p>Linear Regression · Ames Housing Dataset</p>
            </div>
          </div>
          <div className="header-right">
            {loading && <span className="live-indicator">⟳ Updating...</span>}
            <div className="badge">SCT_ML_1</div>
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Stats Bar ── */}
        {stats && (
          <section className="stats-bar">
            {[
              { label: "Model Accuracy (R²)", value: `${stats.r2}%` },
              { label: "Avg Error (MAE)",     value: fmtShort(stats.mae) },
              { label: "Avg House Price",     value: fmtShort(stats.mean_price) },
              { label: "Training Samples",    value: stats.train_size.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </div>
            ))}
          </section>
        )}

        <div className="content-grid">
          {/* ── Left: Inputs ── */}
          <section className="panel inputs-panel">
            <h2 className="panel-title"><span className="panel-icon">⚙️</span> Property Details</h2>
            <SliderInput label="Above-Ground Living Area" name="grLivArea"
              min={300} max={5000} step={50} value={inputs.grLivArea}
              onChange={handleChange} unit="sq ft" description="Main living space" />
            <SliderInput label="Basement Area" name="totalBsmtSF"
              min={0} max={3000} step={50} value={inputs.totalBsmtSF}
              onChange={handleChange} unit="sq ft" description="Total basement" />
            <SliderInput label="Bedrooms" name="bedrooms"
              min={0} max={8} step={1} value={inputs.bedrooms}
              onChange={handleChange} unit="rooms" description="Above grade only" />
            <SliderInput label="Full Bathrooms" name="fullBath"
              min={0} max={4} step={1} value={inputs.fullBath}
              onChange={handleChange} unit="" description="Above grade" />
            <SliderInput label="Half Bathrooms" name="halfBath"
              min={0} max={2} step={1} value={inputs.halfBath}
              onChange={handleChange} unit="" description="Above grade" />

            {error && <div className="error-box">⚠️ {error}</div>}

            {/* Property Summary */}
            <div className="summary">
              <h3 className="section-label">📋 Property Summary</h3>
              <div className="summary-grid">
                {[
                  { icon: "📐", val: `${totalSqFt.toLocaleString("en-IN")} sq ft`, key: "Total Area" },
                  { icon: "🛏️", val: inputs.bedrooms, key: "Bedrooms" },
                  { icon: "🚿", val: totalBaths,       key: "Total Baths" },
                  { icon: "🏗️", val: `${inputs.totalBsmtSF.toLocaleString("en-IN")} sq ft`, key: "Basement" },
                ].map(({ icon, val, key }) => (
                  <div key={key} className="summary-item">
                    <span className="summary-icon">{icon}</span>
                    <div><div className="summary-val">{val}</div><div className="summary-key">{key}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Right: Results ── */}
          <section className="panel result-panel">
            {/* Price Display */}
            <div className={`price-display ${result ? "revealed" : ""}`}>
              {result ? (
                <>
                  <div className="price-label">Estimated Sale Price</div>
                  <div className="price-value">{fmt(animatedPrice)}</div>
                  <div className="price-band">
                    <span className="band-low">{fmtShort(result.price_low)}</span>
                    <div className="band-bar">
                      <div className="band-fill" />
                    </div>
                    <span className="band-high">{fmtShort(result.price_high)}</span>
                  </div>
                  <div className="price-meta">
                    <span>₹{result.price_per_sqft?.toLocaleString("en-IN")}/sq ft</span>
                    <span className="dot-sep">·</span>
                    <span>{result.pct_vs_avg > 0 ? "↑" : "↓"} {Math.abs(result.pct_vs_avg)}% vs avg</span>
                  </div>
                </>
              ) : (
                <div className="price-placeholder">
                  <div className="house-icon">🏠</div>
                  <p>Adjust the sliders to get<br /><strong>a live price estimate</strong></p>
                </div>
              )}
            </div>

            {/* Gauge */}
            {result && (
              <div className="gauge-wrap">
                <Gauge pct={result.pct_vs_avg} />
              </div>
            )}

            {/* Tab Navigation */}
            <div className="tabs">
              {[
                { id: "breakdown",     label: "💡 Breakdown" },
                { id: "tips",          label: "🚀 Boost Value" },
                { id: "emi",           label: "🏦 EMI" },
                { id: "market",        label: "📊 Market" },
                { id: "neighbourhood", label: "🏘️ Areas" },
              ].map(({ id, label }) => (
                <button key={id}
                  className={`tab-btn ${tab === id ? "active" : ""}`}
                  onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {tab === "breakdown"     && <ContributionBars contributions={result?.contributions} />}
              {tab === "tips"          && <Tips tips={result?.tips} />}
              {tab === "emi"           && <EMICalc price={result?.predicted_price ?? stats?.mean_price ?? 5000000} />}
              {tab === "market"        && <DistributionChart data={stats?.price_distribution} currentPrice={result?.predicted_price} />}
              {tab === "neighbourhood" && <NeighbourhoodChart data={stats?.neighborhood_avg} />}
            </div>
          </section>
        </div>
      </main>

      <footer className="footer">
        SkillCraft Technology · Machine Learning Internship · Task 01 · Linear Regression on Ames Housing Dataset
      </footer>
    </div>
  );
}
