require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const API_KEY = process.env.SOSO_API_KEY;
const CG_API_KEY = process.env.CG_API_KEY;

console.log("==================================");
console.log("🔑 SOSO API:", API_KEY ? "LOADED ✅" : "MISSING ❌");
console.log("🔑 CoinGecko API:", CG_API_KEY ? "LOADED ✅" : "MISSING ❌");
console.log("==================================");

const BASE_URL = "https://openapi.sosovalue.com/api/v1";
const CG_BASE = "https://api.coingecko.com/api/v3";

// =========================
// TRADINGVIEW PAIRS
// =========================
const tokenPairs = {
  BTC: "BINANCE:BTCUSDT", ETH: "BINANCE:ETHUSDT", SOL: "BINANCE:SOLUSDT",
  TON: "BINANCE:TONUSDT", FET: "BINANCE:FETUSDT", RNDR: "BINANCE:RNDRUSDT",
  TAO: "BINANCE:TAOUSDT", BNB: "BINANCE:BNBUSDT", XRP: "BINANCE:XRPUSDT",
  ADA: "BINANCE:ADAUSDT", DOGE: "BINANCE:DOGEUSDT", AVAX: "BINANCE:AVAXUSDT",
  DOT: "BINANCE:DOTUSDT", LINK: "BINANCE:LINKUSDT", MATIC: "BINANCE:MATICUSDT",
  UNI: "BINANCE:UNIUSDT", LTC: "BINANCE:LTCUSDT", ATOM: "BINANCE:ATOMUSDT",
  NEAR: "BINANCE:NEARUSDT", APT: "BINANCE:APTUSDT", OP: "BINANCE:OPUSDT",
  ARB: "BINANCE:ARBUSDT", SUI: "BINANCE:SUIUSDT", INJ: "BINANCE:INJUSDT",
  TIA: "BINANCE:TIAUSDT", PEPE: "BINANCE:PEPEUSDT", WIF: "BINANCE:WIFUSDT",
  BONK: "BINANCE:BONKUSDT", FLOKI: "BINANCE:FLOKIUSDT", JTO: "BINANCE:JTOUSDT",
  PYTH: "BINANCE:PYTHUSDT", JUP: "BINANCE:JUPUSDT", GRASS: "BINANCE:GRASSUSDT",
  POPCAT: "BINANCE:POPCATUSDT", NEIRO: "BINANCE:NEIROUSDT", RENDER: "BINANCE:RENDERUSDT",
  W: "BINANCE:WUSDT", STRK: "BINANCE:STRKUSDT", MANTA: "BINANCE:MANTAUSDT",
  ENA: "BINANCE:ENAUSDT", EIGEN: "BINANCE:EIGENUSDT", NOT: "BINANCE:NOTUSDT",
  TRUMP: "BINANCE:TRUMPUSDT", PENGU: "BINANCE:PENGUUSDT", MOVE: "BINANCE:MOVEUSDT",
  ZK: "BINANCE:ZKUSDT", BLAST: "BINANCE:BLASTUSDT", SHIB: "BINANCE:SHIBUSDT",
  HBAR: "BINANCE:HBARUSDT", ALGO: "BINANCE:ALGOUSDT", XLM: "BINANCE:XLMUSDT",
  AAVE: "BINANCE:AAVEUSDT", MKR: "BINANCE:MKRUSDT", GRT: "BINANCE:GRTUSDT",
  IMX: "BINANCE:IMXUSDT", LDO: "BINANCE:LDOUSDT", SNX: "BINANCE:SNXUSDT",
  CRV: "BINANCE:CRVUSDT", CAKE: "BINANCE:CAKEUSDT", VET: "BINANCE:VETUSDT",
  FIL: "BINANCE:FILUSDT", SAND: "BINANCE:SANDUSDT", MANA: "BINANCE:MANAUSDT",
  AXS: "BINANCE:AXSUSDT", GALA: "BINANCE:GALAUSDT", CHZ: "BINANCE:CHZUSDT",
};

// =========================
// COINGECKO ID MAP
// =========================
const cgIdMap = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", TON: "the-open-network",
  FET: "fetch-ai", RNDR: "render-token", RENDER: "render-token", TAO: "bittensor",
  BNB: "binancecoin", XRP: "ripple", ADA: "cardano", DOGE: "dogecoin",
  AVAX: "avalanche-2", DOT: "polkadot", LINK: "chainlink", MATIC: "matic-network",
  UNI: "uniswap", LTC: "litecoin", ATOM: "cosmos", NEAR: "near", APT: "aptos",
  OP: "optimism", ARB: "arbitrum", SUI: "sui", INJ: "injective-protocol",
  TIA: "celestia", PEPE: "pepe", WIF: "dogwifcoin", BONK: "bonk", FLOKI: "floki",
  JTO: "jito-governance-token", PYTH: "pyth-network", JUP: "jupiter-exchange-solana",
  GRASS: "grass", SHIB: "shiba-inu", HBAR: "hedera-hashgraph", ALGO: "algorand",
  XLM: "stellar", AAVE: "aave", MKR: "maker", GRT: "the-graph",
  IMX: "immutable-x", LDO: "lido-dao", ENA: "ethena", TRUMP: "official-trump",
  PENGU: "pudgy-penguins", NOT: "notcoin", SNX: "havven", CRV: "curve-dao-token",
};

// =========================
// CHAIN NAME CLEANER
// =========================
const cleanChainName = (raw) => {
  if (!raw) return "Unknown";
  const map = {
    "ethereum": "Ethereum", "solana": "Solana", "binance-smart-chain": "BNB Chain",
    "polygon-pos": "Polygon", "avalanche": "Avalanche", "arbitrum-one": "Arbitrum",
    "optimistic-ethereum": "Optimism", "fantom": "Fantom", "base": "Base",
    "sui": "Sui", "aptos": "Aptos", "near-protocol": "NEAR", "tron": "Tron",
    "cosmos": "Cosmos", "ton": "TON", "the-open-network": "TON",
    "cardano": "Cardano", "polkadot": "Polkadot", "algorand": "Algorand",
    "stellar": "Stellar", "hedera-hashgraph": "Hedera", "xrp": "XRP Ledger",
  };
  return map[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1);
};

// =========================
// RESOLVE CHART SYMBOL
// =========================
const resolveChartSymbol = (coinSymbol) => {
  const upper = coinSymbol.toUpperCase();
  return tokenPairs[upper] || `BINANCE:${upper}USDT`;
};

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => res.send("🚀 ChainPulse AI Backend Running"));

// =========================
// LIVE MARKET
// =========================
app.get("/market", async (req, res) => {
  try {
    const symbols = ["BTCUSDT","ETHUSDT","SOLUSDT","TONUSDT","FETUSDT","RNDRUSDT"];
    const response = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    const filtered = response.data.filter((c) => symbols.includes(c.symbol));
    const market = filtered.map((coin) => ({
      symbol: coin.symbol.replace("USDT", ""),
      price: Number(coin.lastPrice).toFixed(2),
      change: Number(coin.priceChangePercent).toFixed(2),
    }));
    res.json(market);
  } catch (err) {
    console.log(err.message);
    res.json([]);
  }
});

// =========================
// TOP OPPORTUNITIES (new endpoint)
// =========================
app.get("/opportunities", async (req, res) => {
  const TOP_TOKENS = ["bitcoin","ethereum","solana","binancecoin","ripple"];
  try {
    // Fetch market data for top tokens
    const marketRes = await axios.get(`${CG_BASE}/coins/markets`, {
      params: {
        vs_currency: "usd",
        ids: TOP_TOKENS.join(","),
        order: "market_cap_desc",
        per_page: 5,
        page: 1,
        sparkline: false,
      },
      headers: { "x-cg-demo-api-key": CG_API_KEY },
    });

    // Fetch SoSoValue headlines once for sentiment
    let headlines = "";
    try {
      const sosoRes = await axios.get(`${BASE_URL}/news/featured/currency`, {
        params: { pageNum: 1, pageSize: 10 },
        headers: { "x-soso-api-key": API_KEY },
      });
      const list = sosoRes.data?.data?.list || [];
      headlines = list
        .map((item) => item?.multilanguageContent?.[0]?.title || item?.title || "")
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    } catch (_) {}

    const bullishKeywords = ["surge","bull","etf","rally","growth","adoption","breakout","ai","partnership","record","gain","pump"];
    const bearishKeywords = ["hack","crash","sell-off","fear","lawsuit","decline","exploit","drop","ban","loss","warning","dump"];
    let bullishScore = 0, bearishScore = 0;
    bullishKeywords.forEach((w) => { if (headlines.includes(w)) bullishScore++; });
    bearishKeywords.forEach((w) => { if (headlines.includes(w)) bearishScore++; });

    let sentiment = "NEUTRAL", confidence = 62;
    if (bullishScore > bearishScore) { sentiment = "BULLISH"; confidence = Math.min(95, 70 + bullishScore * 3); }
    else if (bearishScore > bullishScore) { sentiment = "BEARISH"; confidence = Math.min(95, 70 + bearishScore * 3); }

    const opportunities = (marketRes.data || []).map((coin) => {
      const change = coin.price_change_percentage_24h || 0;
      const volume = coin.total_volume || 0;

      // Per-token sentiment adjustment based on price movement
      let tokenSentiment = sentiment;
      let tokenConfidence = confidence;
      if (change > 5) { tokenSentiment = "BULLISH"; tokenConfidence = Math.min(95, confidence + 10); }
      if (change < -5) { tokenSentiment = "BEARISH"; tokenConfidence = Math.min(95, confidence + 5); }

      let score = 50;
      if (tokenSentiment === "BULLISH") score += 20;
      if (tokenSentiment === "BEARISH") score -= 20;
      score += (tokenConfidence - 50) * 0.4;
      if (volume > 1_000_000_000) score += 10;
      if (change > 5) score += 10;
      if (change < -5) score -= 10;
      score = Math.max(0, Math.min(100, Math.round(score)));

      let riskScore = 50;
      if (volume < 10_000_000) riskScore += 25;
      if (change > 10 || change < -10) riskScore += 15;
      if (tokenSentiment === "BEARISH") riskScore += 20;
      riskScore = Math.max(0, Math.min(100, riskScore));

      const signal = tokenSentiment === "BULLISH" ? "BUY" : tokenSentiment === "BEARISH" ? "SELL" : "HOLD";

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: change,
        marketCap: coin.market_cap,
        volume,
        opportunityScore: score,
        riskScore,
        sentiment: tokenSentiment,
        signal,
        confidence: tokenConfidence,
      };
    });

    // Sort by opportunity score descending
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    res.json({ opportunities, sentiment, headlines: headlines.slice(0, 200) });
  } catch (err) {
    console.log("Opportunities error:", err.message);
    res.status(500).json({ opportunities: [] });
  }
});

// =========================
// DETECT INPUT TYPE
// =========================
const detectInputType = (token) => {
  if (token.startsWith("0x")) return "ethereum";
  if (token.startsWith("EQ")) return "ton";
  if (token.length >= 32 && token.length <= 44 && !token.startsWith("0x")) return "solana";
  return "symbol";
};

// =========================
// EXECUTION ROUTER
// =========================
const generateExecutionLinks = (type, token, chain) => {
  let tradeUrl = "", platform = "";
  if (type === "ethereum") { platform = "Uniswap"; tradeUrl = `https://app.uniswap.org/#/swap?outputCurrency=${token}`; }
  else if (type === "solana") { platform = "Jupiter"; tradeUrl = `https://jup.ag/swap/SOL-${token}`; }
  else if (type === "ton") { platform = "STON.fi"; tradeUrl = "https://ston.fi/"; }
  else {
    const lc = (chain || "").toLowerCase();
    if (lc.includes("solana")) { platform = "Jupiter"; tradeUrl = `https://jup.ag/swap/SOL-${token}`; }
    else if (lc.includes("bnb") || lc.includes("binance")) { platform = "PancakeSwap"; tradeUrl = `https://pancakeswap.finance/swap`; }
    else if (lc.includes("polygon")) { platform = "QuickSwap"; tradeUrl = `https://quickswap.exchange/#/swap`; }
    else if (lc.includes("arbitrum")) { platform = "Uniswap (Arbitrum)"; tradeUrl = `https://app.uniswap.org/#/swap`; }
    else if (lc.includes("base")) { platform = "Uniswap (Base)"; tradeUrl = `https://app.uniswap.org/#/swap`; }
    else { platform = "Binance"; tradeUrl = `https://www.binance.com/en/trade/${token}_USDT`; }
  }
  return { platform, tradeUrl };
};

// =========================
// OPPORTUNITY SCORE
// =========================
const calculateOpportunityScore = ({ sentiment, confidence, volume, change }) => {
  let score = 50;
  if (sentiment === "BULLISH") score += 20;
  if (sentiment === "BEARISH") score -= 20;
  score += (confidence - 50) * 0.4;
  if (volume > 1_000_000_000) score += 10;
  else if (volume < 10_000_000) score -= 10;
  if (change > 5) score += 10;
  if (change < -5) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
};

// =========================
// FETCH COINGECKO
// =========================
const fetchCoinGeckoData = async (query) => {
  try {
    const upperQuery = query.toUpperCase();
    let knownId = cgIdMap[upperQuery];

    if (knownId) {
      const marketRes = await axios.get(`${CG_BASE}/coins/markets`, {
        params: { vs_currency: "usd", ids: knownId, order: "market_cap_desc", per_page: 1, page: 1, sparkline: false },
        headers: { "x-cg-demo-api-key": CG_API_KEY },
      });
      const coin = marketRes.data?.[0];
      if (!coin) return null;

      const detailRes = await axios.get(`${CG_BASE}/coins/${knownId}`, {
        params: { localization: false, tickers: false, market_data: false, community_data: false, developer_data: false },
        headers: { "x-cg-demo-api-key": CG_API_KEY },
      });
      const platforms = detailRes.data?.detail_platforms || {};
      const chainKeys = Object.keys(platforms).filter((k) => k !== "");
      const chain = chainKeys[0] ? cleanChainName(chainKeys[0]) : "Native";

      return {
        name: coin.name, symbol: coin.symbol.toUpperCase(), coinId: knownId,
        price: coin.current_price, marketCap: coin.market_cap, volume: coin.total_volume,
        change24h: coin.price_change_percentage_24h, chain,
        multiChain: chainKeys.length > 1, multiChainCount: chainKeys.length,
      };
    }

    const searchRes = await axios.get(`${CG_BASE}/search`, {
      params: { query },
      headers: { "x-cg-demo-api-key": CG_API_KEY },
    });
    const coins = searchRes.data?.coins || [];
    if (!coins.length) return null;

    const candidateIds = coins.slice(0, 8).map((c) => c.id).join(",");
    const marketRes = await axios.get(`${CG_BASE}/coins/markets`, {
      params: { vs_currency: "usd", ids: candidateIds, order: "market_cap_desc", per_page: 8, page: 1, sparkline: false },
      headers: { "x-cg-demo-api-key": CG_API_KEY },
    });
    const marketCoins = marketRes.data || [];
    if (!marketCoins.length) return null;

    const best = marketCoins.reduce((a, b) => (b.market_cap || 0) > (a.market_cap || 0) ? b : a);
    const symbolMatches = marketCoins.filter((c) => c.symbol.toUpperCase() === upperQuery);

    let chain = "Unknown", multiChainCount = 0;
    try {
      const detailRes = await axios.get(`${CG_BASE}/coins/${best.id}`, {
        params: { localization: false, tickers: false, market_data: false, community_data: false, developer_data: false },
        headers: { "x-cg-demo-api-key": CG_API_KEY },
      });
      const platforms = detailRes.data?.detail_platforms || {};
      const chainKeys = Object.keys(platforms).filter((k) => k !== "");
      multiChainCount = chainKeys.length;
      chain = chainKeys.length > 0 ? cleanChainName(chainKeys[0]) : "Native";
    } catch (_) {}

    return {
      name: best.name, symbol: best.symbol.toUpperCase(), coinId: best.id,
      price: best.current_price, marketCap: best.market_cap, volume: best.total_volume,
      change24h: best.price_change_percentage_24h, chain,
      multiChain: symbolMatches.length > 1 || multiChainCount > 1, multiChainCount,
    };
  } catch (err) {
    console.log("CoinGecko error:", err.response?.data || err.message);
    return null;
  }
};

// =========================
// FORMAT HELPERS
// =========================
const formatPrice = (p) => {
  if (p === null || p === undefined) return "N/A";
  if (p >= 1) return `$${Number(p).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 0.0001) return `$${Number(p).toFixed(6)}`;
  return `$${Number(p).toExponential(4)}`;
};
const formatLarge = (n) => {
  if (!n && n !== 0) return "N/A";
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Number(n).toLocaleString()}`;
};
const getTimestamp = () => new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC";

// =========================
// MAIN ANALYSIS
// =========================
app.post("/analyze", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ insight: "❌ Token required" });

  try {
    const inputType = detectInputType(token);
    const cgData = await fetchCoinGeckoData(token);

    if (!cgData) {
      return res.status(404).json({
        insight: `❌ Token "${token}" not found. Please check the symbol and try again.`,
      });
    }

    const { price, marketCap, volume, name: assetName, chain, symbol: coinSymbol } = cgData;
    const change24h = cgData.change24h || 0;
    const execution = generateExecutionLinks(inputType, token, chain);
    const chartSymbol = resolveChartSymbol(coinSymbol);

    // SoSoValue headlines
    let headlines = "  No headlines available";
    try {
      const sosoRes = await axios.get(`${BASE_URL}/news/featured/currency`, {
        params: { pageNum: 1, pageSize: 10 },
        headers: { "x-soso-api-key": API_KEY },
      });
      const list = sosoRes.data?.data?.list || [];
      const arr = list.map((item) => item?.multilanguageContent?.[0]?.title || item?.title || null).filter(Boolean).slice(0, 5);
      if (arr.length) headlines = arr.map((t, i) => `  ${i + 1}. ${t}`).join("\n");
    } catch (_) { console.log("SoSoValue fetch failed"); }

    const text = headlines.toLowerCase();
    const bullishKeywords = ["surge","bull","etf","rally","growth","adoption","breakout","ai","partnership","record","high","gain","pump"];
    const bearishKeywords = ["hack","crash","sell-off","fear","lawsuit","decline","exploit","drop","ban","loss","warning","dump","rug"];
    let bullishScore = 0, bearishScore = 0;
    bullishKeywords.forEach((w) => { if (text.includes(w)) bullishScore++; });
    bearishKeywords.forEach((w) => { if (text.includes(w)) bearishScore++; });
    if (change24h > 5) bullishScore += 2;
    if (change24h < -5) bearishScore += 2;

    let sentiment = "NEUTRAL", signal = "HOLD", confidence = 62, risk = "MEDIUM";
    if (bullishScore > bearishScore) { sentiment = "BULLISH"; signal = "BUY"; confidence = Math.min(95, 70 + bullishScore * 3); risk = "LOW"; }
    else if (bearishScore > bullishScore) { sentiment = "BEARISH"; signal = "SELL"; confidence = Math.min(95, 70 + bearishScore * 3); risk = "HIGH"; }

    const opportunityScore = calculateOpportunityScore({ sentiment, confidence, volume, change: change24h });

    let riskScore = 50;
    if (volume < 10_000_000) riskScore += 25;
    if (change24h > 10 || change24h < -10) riskScore += 15;
    if (sentiment === "BEARISH") riskScore += 20;
    if (confidence < 60) riskScore += 10;
    riskScore = Math.max(0, Math.min(100, riskScore));
    if (riskScore < 35) risk = "LOW";
    else if (riskScore < 70) risk = "MEDIUM";
    else risk = "HIGH";

    const timestamp = getTimestamp();
    const multiChainWarning = cgData.multiChain
      ? `⚠️  Multiple versions of "${coinSymbol}" detected across chains\n    Displaying highest market cap match → ${assetName}\n    Chain: ${chain}\n`
      : "";

    let aiInsight = "";
    if (sentiment === "BULLISH") aiInsight = `Bullish momentum is currently dominant for ${assetName}. Market intelligence signals positive narrative activity with a ${confidence}% confidence reading. Price action shows ${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}% in 24H. Conditions favor accumulation at current levels with ${risk.toLowerCase()} risk exposure.`;
    else if (sentiment === "BEARISH") aiInsight = `Bearish pressure is currently elevated for ${assetName}. Risk-related headlines are active and sentiment reads negative at ${confidence}% confidence. 24H price action of ${change24h.toFixed(2)}% confirms downside pressure. Exercise caution and manage position sizing accordingly.`;
    else aiInsight = `${assetName} is trading in neutral territory. No dominant bullish or bearish narrative detected. Market is in a consolidation phase. Wait for a clearer directional signal before committing to a position.`;

    const insight = `
⚡ ChainPulse AI — Execution Intelligence Terminal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${multiChainWarning ? multiChainWarning + "\n" : ""}🪙  Asset:        ${assetName} (${coinSymbol})
💰  Price:        ${formatPrice(price)}
📈  24H Change:   ${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%
🏦  Market Cap:   ${formatLarge(marketCap)}
📊  Volume:       ${formatLarge(volume)}
🔗  Chain:        ${chain}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠  AI Sentiment:      ${sentiment}
📡  AI Signal:         ${signal}
🎯  Confidence:        ${confidence}%
⚠️   Risk Level:        ${risk}
📊  Opportunity Score: ${opportunityScore}/100
🛡️   Risk Score:        ${riskScore}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰  Market Intelligence (via SoSoValue):
${headlines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖  AI Insight:
  ${aiInsight}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡  Execution Module:
  • Platform:         ${execution.platform}
  • Execution Ready:  YES
  • Trade Link:       ${execution.tradeUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗  Sources:
  • Market Data:         CoinGecko
  • Market Intelligence: SoSoValue
  • Analysis Engine:     ChainPulse AI
  • Timestamp:           ${timestamp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    res.json({
      insight, sentiment, confidence, risk, riskScore, opportunityScore,
      chartSymbol, assetName, symbol: coinSymbol, price, change24h,
      marketCap, volume, chain, multiChain: cgData.multiChain,
      executionPlatform: execution.platform, executionUrl: execution.tradeUrl, timestamp,
    });
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ insight: "❌ Failed to analyze token. Please try again." });
  }
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => console.log(`🚀 ChainPulse AI running on port ${PORT}`));
