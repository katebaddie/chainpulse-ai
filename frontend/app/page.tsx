"use client";

import { useState } from "react";

export default function Home() {
  const [token, setToken] = useState("BTC");
  const [result, setResult] = useState("");
  const [sentiment, setSentiment] = useState("NEUTRAL");
  const [confidence, setConfidence] = useState(0);

  // =========================
  // TOKEN NORMALIZER
  // =========================
  const normalizeToken = (value: string) => {
    const clean = value.trim().toUpperCase();

    // Handle addresses later if needed
    if (clean.startsWith("0X")) {
      return "ETH";
    }

    return clean;
  };

  // =========================
  // ANALYSIS
  // =========================
  const runAnalysis = async () => {
    try {
      setResult("🔄 Scanning market intelligence...");

      const cleanToken = normalizeToken(token);

      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: cleanToken,
        }),
      });

      const data = await res.json();

      setResult(data.insight);

      // Signal parsing
      if (data.insight.includes("BULLISH")) {
        setSentiment("BULLISH");
        setConfidence(85);
      } else if (data.insight.includes("BEARISH")) {
        setSentiment("BEARISH");
        setConfidence(80);
      } else {
        setSentiment("NEUTRAL");
        setConfidence(60);
      }

    } catch (err) {
      setResult("❌ Backend connection failed");
    }
  };

  // =========================
  // CLEAN TOKEN FOR CHART
  // =========================
  const chartToken = normalizeToken(token);

  const sentimentColor =
    sentiment === "BULLISH"
      ? "#00ff9f"
      : sentiment === "BEARISH"
      ? "#ff4d4f"
      : "#999";

  return (
    <main style={styles.container}>

      {/* HEADER */}
      <h1 style={styles.title}>⚡ ChainPulse AI</h1>

      <p style={styles.subtitle}>
        AI-Powered Market Intelligence Terminal
      </p>

      {/* CONTROL PANEL */}
      <div style={styles.topBar}>

        <input
          style={styles.input}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="BTC / TON / Contract Address"
        />

        <button style={styles.button} onClick={runAnalysis}>
          Analyze
        </button>

        <div
          style={{
            ...styles.badge,
            background: sentimentColor,
          }}
        >
          {sentiment}
        </div>

        <div style={styles.confidence}>
          Confidence: {confidence}%
        </div>

      </div>

      {/* DASHBOARD */}
      <div style={styles.grid}>

        {/* CHART PANEL */}
        <div style={styles.card}>
          <h3>📈 Live Market Chart</h3>

          <div style={{ height: "500px", width: "100%" }}>
            <iframe
              key={chartToken}
              src={`https://s.tradingview.com/widgetembed/?symbol=BINANCE:${chartToken}USDT&interval=15&theme=dark&style=1`}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
            />
          </div>
        </div>

        {/* AI PANEL */}
        <div style={styles.card}>
          <h3>🧠 AI Intelligence Engine</h3>

          <pre style={styles.text}>
            {result || "Awaiting market scan..."}
          </pre>
        </div>

      </div>
    </main>
  );
}

// =========================
// STYLES
// =========================
const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#0b0f17",
    color: "#fff",
    padding: "20px",
    fontFamily: "system-ui",
  },

  title: {
    textAlign: "center",
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "5px",
  },

  subtitle: {
    textAlign: "center",
    color: "#888",
    marginBottom: "25px",
  },

  topBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  input: {
    padding: "12px",
    background: "#111",
    border: "1px solid #222",
    borderRadius: "8px",
    color: "#fff",
    width: "250px",
  },

  button: {
    padding: "12px 18px",
    background: "#007bff",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },

  badge: {
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "bold",
    color: "#000",
  },

  confidence: {
    color: "#aaa",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "15px",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },

  text: {
    whiteSpace: "pre-wrap",
    fontSize: "13px",
    lineHeight: "1.6",
  },
};