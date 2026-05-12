require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// =========================
// ENV CHECK (IMPORTANT)
// =========================
const API_KEY = process.env.SOSO_API_KEY;

console.log("==================================");
console.log("🔑 SOSO API KEY STATUS:", API_KEY ? "LOADED ✅" : "MISSING ❌");
console.log("==================================");

// =========================
// BASE URL (FROM DOCS)
// =========================
const BASE_URL = "https://openapi.sosovalue.com/api/v1";

// =========================
// HEALTH CHECK ROUTE
// =========================
app.get("/", (req, res) => {
  res.send("🚀 ChainPulse Backend Running");
});

// =========================
// MAIN ANALYZE ROUTE
// =========================
app.post("/analyze", async (req, res) => {
  const { token } = req.body;

  console.log("📥 REQUEST RECEIVED:", token);

  if (!token) {
    return res.status(400).json({
      insight: "Token is required (e.g BTC)"
    });
  }

  if (!API_KEY) {
    return res.status(500).json({
      insight: "❌ API Key not loaded. Check .env file"
    });
  }

  try {
    // =========================
    // SOSOVALUE API CALL (SAFE)
    // =========================
    const response = await axios.get(
      `${BASE_URL}/news/featured/currency`,
      {
        params: {
          pageNum: 1,
          pageSize: 5
        },
        headers: {
          "x-soso-api-key": API_KEY
        }
      }
    );

    console.log("🔥 RAW API RESPONSE RECEIVED");

    const list = response.data?.data?.list || [];

    if (list.length === 0) {
      return res.json({
        insight: "⚠️ No market news available from SoSoValue"
      });
    }

    // =========================
    // CLEAN HEADLINES (NO NULL)
    // =========================
    const headlines = list
      .map((item) =>
        item?.multilanguageContent?.[0]?.title ||
        item?.title ||
        item?.content ||
        null
      )
      .filter(Boolean)
      .slice(0, 3)
      .map((t, i) => `${i + 1}. ${t}`)
      .join("\n");

    // =========================
    // SIMPLE SENTIMENT ENGINE
    // =========================
    let sentiment = "NEUTRAL";
    let signal = "HOLD";

    const text = headlines.toLowerCase();

    if (text.includes("etf") || text.includes("surge") || text.includes("bull")) {
      sentiment = "BULLISH";
      signal = "BUY";
    }

    if (text.includes("hack") || text.includes("drop") || text.includes("sell")) {
      sentiment = "BEARISH";
      signal = "SELL";
    }

    const confidence =
      sentiment === "NEUTRAL" ? 60 :
      sentiment === "BULLISH" ? 85 : 80;

    // =========================
    // FINAL RESPONSE
    // =========================
    res.json({
      insight: `
⚡ ChainPulse AI — Live Intelligence Engine

🪙 Asset: ${token}

🧠 Sentiment: ${sentiment}
📊 Signal: ${signal}
🎯 Confidence: ${confidence}%

📰 Top News:
${headlines}

🔗 Source: SoSoValue API (LIVE)
      `
    });

  } catch (err) {
    console.log("❌ API ERROR:");
    console.log(err.response?.data || err.message);

    res.status(500).json({
      insight: "❌ SoSoValue API failed — check backend logs"
    });
  }
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});