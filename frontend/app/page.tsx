"use client";

import { useEffect, useState, useRef } from "react";

type Tab = "dashboard" | "scanner" | "opportunities" | "execution" | "watchlist";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number | null;
  change24h: number | null;
  sentiment: string;
  opportunityScore: number | null;
  riskScore: number | null;
  chain: string;
  addedAt: string;
}

interface OpportunityItem {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  opportunityScore: number;
  riskScore: number;
  sentiment: string;
  signal: string;
  confidence: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [token, setToken] = useState("");
  const [market, setMarket] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const [sentiment, setSentiment] = useState("NEUTRAL");
  const [confidence, setConfidence] = useState(0);
  const [chartSymbol, setChartSymbol] = useState("BINANCE:BTCUSDT");
  const [chartKey, setChartKey] = useState(0);
  const [executionUrl, setExecutionUrl] = useState("");
  const [executionPlatform, setExecutionPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [volume, setVolume] = useState<number | null>(null);
  const [chain, setChain] = useState("");
  const [multiChain, setMultiChain] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [opportunityScore, setOpportunityScore] = useState<number | null>(null);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [risk, setRisk] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [searchedBySymbol, setSearchedBySymbol] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live monitoring
  const [liveMonitor, setLiveMonitor] = useState(false);
  const [liveCountdown, setLiveCountdown] = useState(60);
  const liveIntervalRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);

  // Signal history
  const [signalHistory, setSignalHistory] = useState<any[]>([]);

  // Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState<string | null>(null);

  // Opportunities feed
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [oppLoading, setOppLoading] = useState(false);
  const [oppLoaded, setOppLoaded] = useState(false);

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chainpulse_watchlist");
      if (saved) setWatchlist(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const saveWatchlist = (items: WatchlistItem[]) => {
    setWatchlist(items);
    try { localStorage.setItem("chainpulse_watchlist", JSON.stringify(items)); } catch (_) {}
  };

  const fetchMarket = async () => {
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      setMarket(Array.isArray(data) ? data : []);
    } catch (err) { setMarket([]); }
  };

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load opportunities when tab opens
  useEffect(() => {
    if (activeTab === "opportunities" && !oppLoaded) {
      fetchOpportunities();
    }
  }, [activeTab]);

  const fetchOpportunities = async () => {
    setOppLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setOppLoaded(true);
    } catch (_) {
      setOpportunities([]);
    } finally {
      setOppLoading(false);
    }
  };

  const isContractAddress = (input: string) =>
    input.startsWith("0x") || input.startsWith("EQ") ||
    (input.length >= 32 && input.length <= 44 && !input.startsWith("0x"));

  const runAnalysis = async (inputToken?: string, silent = false) => {
    const scanValue = inputToken || token;
    if (!scanValue) return;
    try {
      if (!silent) {
        setLoading(true);
        setResult("🔄 Scanning multi-chain intelligence...");
        setHasResult(false);
        setSearchedBySymbol(!isContractAddress(scanValue));
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: scanValue }),
      });
      const data = await res.json();

      setResult(data.insight || "No analysis returned");
      setSentiment(data.sentiment || "NEUTRAL");
      setConfidence(data.confidence || 0);
      setExecutionUrl(data.executionUrl || "");
      setExecutionPlatform(data.executionPlatform || "");
      setAssetName(data.assetName || "");
      setSymbol(data.symbol || "");
      setPrice(data.price ?? null);
      setChange24h(data.change24h ?? null);
      setMarketCap(data.marketCap ?? null);
      setVolume(data.volume ?? null);
      setChain(data.chain || "");
      setMultiChain(data.multiChain || false);
      setTimestamp(data.timestamp || "");
      setOpportunityScore(data.opportunityScore ?? null);
      setRiskScore(data.riskScore ?? null);
      setRisk(data.risk || "");
      setHasResult(true);

      const newSymbol = data.chartSymbol || `BINANCE:${scanValue.toUpperCase()}USDT`;
      setChartSymbol(newSymbol);
      setChartKey((prev) => prev + 1);

      // Add to signal history
      setSignalHistory((prev) => [
        {
          token: data.assetName || scanValue,
          symbol: data.symbol || scanValue,
          sentiment: data.sentiment,
          signal: data.sentiment === "BULLISH" ? "BUY" : data.sentiment === "BEARISH" ? "SELL" : "HOLD",
          confidence: data.confidence,
          opportunityScore: data.opportunityScore,
          timestamp: data.timestamp,
        },
        ...prev.slice(0, 4),
      ]);

    } catch (err) {
      if (!silent) setResult("❌ Backend connection failed");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Live monitoring toggle
  const toggleLiveMonitor = () => {
    if (liveMonitor) {
      clearInterval(liveIntervalRef.current);
      clearInterval(countdownRef.current);
      setLiveMonitor(false);
      setLiveCountdown(60);
    } else {
      if (!hasResult) return;
      setLiveMonitor(true);
      setLiveCountdown(60);
      liveIntervalRef.current = setInterval(() => {
        runAnalysis(token || symbol, true);
        setLiveCountdown(60);
      }, 60000);
      countdownRef.current = setInterval(() => {
        setLiveCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(liveIntervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  // Add to watchlist
  const addToWatchlist = () => {
    if (!hasResult || !symbol) return;
    const exists = watchlist.find((w) => w.symbol === symbol);
    if (exists) return;
    const item: WatchlistItem = {
      symbol, name: assetName, price, change24h, sentiment,
      opportunityScore, riskScore, chain,
      addedAt: new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC",
    };
    saveWatchlist([item, ...watchlist]);
  };

  const removeFromWatchlist = (sym: string) => {
    saveWatchlist(watchlist.filter((w) => w.symbol !== sym));
  };

  const refreshWatchlistItem = async (sym: string) => {
    setWatchlistLoading(sym);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sym }),
      });
      const data = await res.json();
      const updated = watchlist.map((w) =>
        w.symbol === sym ? {
          ...w, price: data.price, change24h: data.change24h,
          sentiment: data.sentiment, opportunityScore: data.opportunityScore,
          riskScore: data.riskScore,
        } : w
      );
      saveWatchlist(updated);
    } catch (_) {}
    setWatchlistLoading(null);
  };

  const copyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ========================= HELPERS =========================
  const sentimentColor = sentiment === "BULLISH" ? "#00ff99" : sentiment === "BEARISH" ? "#ff4d4f" : "#999";
  const signalLabel = sentiment === "BULLISH" ? "BUY" : sentiment === "BEARISH" ? "SELL" : "HOLD";

  const formatPrice = (p: number | null) => {
    if (p === null) return "—";
    if (p >= 1) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (p >= 0.0001) return `$${p.toFixed(6)}`;
    return `$${p.toExponential(4)}`;
  };

  const formatLarge = (n: number | null) => {
    if (n === null) return "—";
    if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  const riskColor = (r: string) => r === "LOW" ? "#00ff99" : r === "HIGH" ? "#ff4d4f" : "#f5a623";
  const riskScoreColor = (s: number | null) => s === null ? "#aaa" : s < 35 ? "#00ff99" : s < 70 ? "#f5a623" : "#ff4d4f";
  const sentColor = (s: string) => s === "BULLISH" ? "#00ff99" : s === "BEARISH" ? "#ff4d4f" : "#999";
  const change24hStr = change24h !== null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "—";
  const change24hColor = (change24h ?? 0) >= 0 ? "#00ff99" : "#ff4d4f";

  // ========================= REUSABLE UI =========================
  const searchBar = (
    <div style={styles.searchBar}>
      <input
        style={styles.input}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter symbol (BTC, GRASS, SOL) or contract address (0x..., EQ...)..."
        onKeyDown={(e) => { if (e.key === "Enter") runAnalysis(); }}
      />
      <button style={styles.button} onClick={() => runAnalysis()} disabled={loading}>
        {loading ? "Scanning..." : "⚡ Run AI Scan"}
      </button>
    </div>
  );

  const multiChainBanner = multiChain ? (
    <div style={styles.multiChainBanner}>
      ⚠️ Multiple chains detected for <strong>{symbol}</strong> — displaying highest market cap match
      {chain && <> &nbsp;|&nbsp; Chain: <strong>{chain}</strong></>}
    </div>
  ) : null;

  const symbolNote = hasResult && searchedBySymbol && assetName ? (
    <div style={styles.noteBanner}>
      📌 <strong>Note:</strong> Showing <strong>{assetName} ({symbol})</strong> on <strong>{chain}</strong> — highest market cap match for this symbol. If you were looking for a different version of <strong>{symbol}</strong> on another chain, try searching by contract address for an exact result.
    </div>
  ) : null;

  const assetStrip = assetName ? (
    <div style={styles.assetStrip}>
      {[
        { label: "Asset", value: `${assetName} (${symbol})`, color: "#fff" },
        { label: "Price", value: formatPrice(price), color: "#fff" },
        { label: "24H Change", value: change24hStr, color: change24hColor },
        { label: "Market Cap", value: formatLarge(marketCap), color: "#fff" },
        { label: "Volume", value: formatLarge(volume), color: "#fff" },
        { label: "Chain", value: chain || "—", color: "#fff" },
        { label: "Opportunity", value: opportunityScore !== null ? `${opportunityScore}/100` : "—", color: "#00ff99" },
        { label: "Risk Score", value: riskScore !== null ? `${riskScore}/100` : "—", color: riskScoreColor(riskScore) },
      ].map((item) => (
        <div key={item.label} style={styles.assetStripItem}>
          <span style={styles.assetLabel}>{item.label}</span>
          <span style={{ ...styles.assetValue, color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  ) : null;

  const infoRow = (label: string, value: string, color = "#fff") => (
    <div key={label} style={styles.infoRow}>
      <span style={{ color: "#666", fontSize: "12px" }}>{label}</span>
      <span style={{ color, fontWeight: "bold", fontSize: "13px" }}>{value}</span>
    </div>
  );

  const scoreBlock = (label: string, score: number | null, color: string) => (
    <>
      <div style={styles.scoreRow}>
        <span style={{ color: "#888" }}>{label}</span>
        <span style={{ color, fontWeight: "bold", fontSize: "18px" }}>{score ?? "—"}/100</span>
      </div>
      <div style={styles.scoreBar}>
        <div style={{ ...styles.scoreBarFill, width: `${score ?? 0}%`, background: color }} />
      </div>
    </>
  );

  const emptyState = (icon: string, title: string, subtitle: string, btnLabel?: string, btnTab?: Tab) => (
    <div style={styles.emptyState}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
      <div style={{ color: "#00ff99", fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>{title}</div>
      <div style={{ color: "#aaa", fontSize: "14px", maxWidth: "420px", textAlign: "center" as const, lineHeight: "1.7" }}>{subtitle}</div>
      {btnLabel && btnTab && (
        <button style={{ ...styles.button, marginTop: "24px" }} onClick={() => setActiveTab(btnTab)}>{btnLabel}</button>
      )}
    </div>
  );

  const menuItems: { key: Tab; icon: string; label: string }[] = [
    { key: "dashboard", icon: "🖥️", label: "Dashboard" },
    { key: "scanner", icon: "🔍", label: "AI Scanner" },
    { key: "opportunities", icon: "📈", label: "Opportunities" },
    { key: "execution", icon: "⚡", label: "Execution Layer" },
    { key: "watchlist", icon: "👁️", label: "Watchlist" },
  ];

  return (
    <main style={styles.container}>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>⚡ ChainPulse AI</h2>
        <div style={styles.menu}>
          {menuItems.map((item) => (
            <div key={item.key}
              style={activeTab === item.key ? styles.menuActive : styles.menuItem}
              onClick={() => setActiveTab(item.key)}>
              {item.icon} {item.label}
              {item.key === "watchlist" && watchlist.length > 0 && (
                <span style={styles.badge}>{watchlist.length}</span>
              )}
            </div>
          ))}
        </div>
        {hasResult && (
          <div style={styles.scannedBadge}>
            <div style={{ color: "#555", fontSize: "10px", marginBottom: "4px", letterSpacing: "0.05em" }}>LAST SCANNED</div>
            <div style={{ color: "#00ff99", fontWeight: "bold", fontSize: "13px" }}>{assetName || token}</div>
            <div style={{ color: "#555", fontSize: "11px" }}>{chain}</div>
            {liveMonitor && (
              <div style={{ color: "#f5a623", fontSize: "11px", marginTop: "6px" }}>
                🟠 Live — refresh in {liveCountdown}s
              </div>
            )}
          </div>
        )}
      </aside>

      <section style={styles.content}>

        {/* ===================== DASHBOARD ===================== */}
        {activeTab === "dashboard" && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>Multi-Chain AI Execution Terminal</h1>
                <p style={styles.subtitle}>Discover → Analyze → Execute</p>
              </div>
              <div style={styles.signalBox}>
                <div style={{ color: "#888", marginBottom: "6px" }}>Market Sentiment</div>
                <div style={{ color: sentimentColor, fontSize: "24px", fontWeight: "bold" }}>{sentiment}</div>
                <div style={{ color: "#aaa", marginTop: "6px" }}>Confidence {confidence}%</div>
              </div>
            </div>

            <div style={styles.tokenGrid}>
              {Array.isArray(market) && market.map((coin) => (
                <div key={coin.symbol} style={styles.tokenCard} onClick={() => setToken(coin.symbol)}>
                  <div style={styles.tokenName}>{coin.symbol}</div>
                  <div style={styles.tokenPrice}>${coin.price}</div>
                  <div style={{ color: Number(coin.change) >= 0 ? "#00ff99" : "#ff4d4f" }}>{coin.change}%</div>
                </div>
              ))}
            </div>

            {searchBar}
            {multiChainBanner}
            {assetStrip}
            {symbolNote}

            {/* ACTION ROW */}
            {hasResult && (
              <div style={styles.actionRow}>
                <button onClick={toggleLiveMonitor} style={{
                  ...styles.actionBtn,
                  background: liveMonitor ? "#1a1200" : "#0d151c",
                  border: liveMonitor ? "1px solid #f5a623" : "1px solid #1c2a35",
                  color: liveMonitor ? "#f5a623" : "#aaa",
                }}>
                  {liveMonitor ? `🟠 Live ON — ${liveCountdown}s` : "🔴 Start Live Monitor"}
                </button>
                <button onClick={addToWatchlist} style={{
                  ...styles.actionBtn,
                  background: watchlist.find(w => w.symbol === symbol) ? "#0a1f0a" : "#0d151c",
                  border: watchlist.find(w => w.symbol === symbol) ? "1px solid #00ff9960" : "1px solid #1c2a35",
                  color: watchlist.find(w => w.symbol === symbol) ? "#00ff99" : "#aaa",
                }}>
                  {watchlist.find(w => w.symbol === symbol) ? "✅ In Watchlist" : "👁️ Add to Watchlist"}
                </button>
                <button onClick={copyReport} style={{ ...styles.actionBtn, background: "#0d151c", border: "1px solid #1c2a35", color: copied ? "#00ff99" : "#aaa" }}>
                  {copied ? "✅ Copied!" : "📋 Copy Report"}
                </button>
              </div>
            )}

            <div style={styles.grid}>
              <div style={styles.chartCard}>
                <div style={styles.cardHeader}>📈 Market Visualization — {chartSymbol}</div>
                <div style={{ height: "520px" }}>
                  <iframe key={chartKey}
                    src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(chartSymbol)}&interval=60&theme=dark&style=1&hide_top_toolbar=0&save_image=0`}
                    width="100%" height="100%" frameBorder="0" scrolling="no" allowFullScreen />
                </div>
              </div>

              <div style={styles.rightPanel}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>🧠 AI Intelligence</div>
                  <div style={{ ...styles.signalBig, color: sentimentColor }}>{signalLabel}</div>
                  <pre style={styles.aiText}>{result || "Awaiting scan..."}</pre>
                </div>

                {/* SIGNAL HISTORY */}
                {signalHistory.length > 0 && (
                  <div style={styles.card}>
                    <div style={styles.cardHeader}>📜 Signal History</div>
                    {signalHistory.map((h, i) => (
                      <div key={i} style={{ ...styles.infoRow, flexDirection: "column" as const, alignItems: "flex-start", gap: "2px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "13px" }}>{h.token} ({h.symbol})</span>
                          <span style={{ color: sentColor(h.sentiment), fontWeight: "bold", fontSize: "13px" }}>{h.signal}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                          <span style={{ color: "#555", fontSize: "11px" }}>{h.timestamp}</span>
                          <span style={{ color: "#aaa", fontSize: "11px" }}>Score: {h.opportunityScore}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.card}>
                  <div style={styles.cardHeader}>⚡ Execution Module</div>
                  <div style={styles.executionInfo}>
                    <span style={{ color: "#888" }}>Platform:</span>
                    <span style={{ color: "#00ff99", fontWeight: "bold" }}>{executionPlatform || "N/A"}</span>
                  </div>
                  {executionUrl && (
                    <a href={executionUrl} target="_blank" rel="noreferrer" style={styles.tradeButton}>Execute Trade →</a>
                  )}
                </div>

                <div style={styles.card}>
                  <div style={styles.cardHeader}>🔗 Sources</div>
                  {[["Market Data", "CoinGecko"], ["Market Intelligence", "SoSoValue"], ["Analysis Engine", "ChainPulse AI"]].map(([k, v]) => (
                    <div key={k} style={styles.sourceRow}>
                      <span style={{ color: "#00ff99" }}>•</span>
                      <span style={{ color: "#aaa" }}>{k}: <span style={{ color: "#00ff99" }}>{v}</span></span>
                    </div>
                  ))}
                  {timestamp && <div style={{ color: "#555", fontSize: "12px", marginTop: "12px" }}>🕐 {timestamp}</div>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===================== AI SCANNER ===================== */}
        {activeTab === "scanner" && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>🔍 AI Scanner</h1>
                <p style={styles.subtitle}>Scan any token by symbol or contract address</p>
              </div>
            </div>
            <div style={styles.moduleDesc}>
              The AI Scanner is ChainPulse AI's core intelligence engine. Enter any token symbol (e.g. <strong>GRASS</strong>, <strong>SOL</strong>, <strong>PEPE</strong>) or paste a contract address (Ethereum 0x..., Solana, TON EQ...) for a full multi-chain analysis — sentiment, risk scoring, opportunity rating, and live market intelligence powered by CoinGecko and SoSoValue.
            </div>

            {searchBar}
            {multiChainBanner}
            {symbolNote}

            {hasResult && (
              <>
                {assetStrip}
                <div style={styles.actionRow}>
                  <button onClick={toggleLiveMonitor} style={{
                    ...styles.actionBtn,
                    background: liveMonitor ? "#1a1200" : "#0d151c",
                    border: liveMonitor ? "1px solid #f5a623" : "1px solid #1c2a35",
                    color: liveMonitor ? "#f5a623" : "#aaa",
                  }}>
                    {liveMonitor ? `🟠 Live ON — refreshing in ${liveCountdown}s` : "🔴 Start Live Monitor"}
                  </button>
                  <button onClick={addToWatchlist} style={{
                    ...styles.actionBtn,
                    background: watchlist.find(w => w.symbol === symbol) ? "#0a1f0a" : "#0d151c",
                    border: watchlist.find(w => w.symbol === symbol) ? "1px solid #00ff9960" : "1px solid #1c2a35",
                    color: watchlist.find(w => w.symbol === symbol) ? "#00ff99" : "#aaa",
                  }}>
                    {watchlist.find(w => w.symbol === symbol) ? "✅ In Watchlist" : "👁️ Add to Watchlist"}
                  </button>
                  <button onClick={copyReport} style={{ ...styles.actionBtn, background: "#0d151c", border: "1px solid #1c2a35", color: copied ? "#00ff99" : "#aaa" }}>
                    {copied ? "✅ Copied!" : "📋 Copy Report"}
                  </button>
                </div>

                <div style={styles.scanResultGrid}>
                  <div style={styles.card}>
                    <div style={styles.cardHeader}>🧠 AI Signal</div>
                    <div style={{ ...styles.signalBig, color: sentimentColor, fontSize: "48px" }}>{signalLabel}</div>
                    <div style={{ color: sentimentColor, fontSize: "15px", marginBottom: "8px" }}>{sentiment}</div>
                    <div style={{ color: "#aaa", fontSize: "13px" }}>Confidence: <strong style={{ color: "#fff" }}>{confidence}%</strong></div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardHeader}>📊 Scores</div>
                    {scoreBlock("Opportunity", opportunityScore, "#00ff99")}
                    <div style={{ marginTop: "18px" }} />
                    {scoreBlock("Risk Score", riskScore, riskScoreColor(riskScore))}
                    <div style={{ ...styles.scoreRow, marginTop: "18px" }}>
                      <span style={{ color: "#888" }}>Risk Level</span>
                      <span style={{ color: riskColor(risk), fontWeight: "bold" }}>{risk || "—"}</span>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardHeader}>🪙 Token Info</div>
                    {infoRow("Name", assetName)}
                    {infoRow("Symbol", symbol)}
                    {infoRow("Chain", chain)}
                    {infoRow("Price", formatPrice(price))}
                    {infoRow("24H Change", change24hStr, change24hColor)}
                    {infoRow("Market Cap", formatLarge(marketCap))}
                    {infoRow("Volume", formatLarge(volume))}
                  </div>

                  <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
                    <div style={styles.cardHeader}>📰 Full AI Analysis</div>
                    <pre style={styles.aiText}>{result}</pre>
                  </div>

                  {signalHistory.length > 0 && (
                    <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
                      <div style={styles.cardHeader}>📜 Signal History</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                        {signalHistory.map((h, i) => (
                          <div key={i} style={{ background: "#081018", borderRadius: "10px", padding: "12px", border: "1px solid #12202b" }}>
                            <div style={{ color: "#aaa", fontSize: "11px", marginBottom: "4px" }}>{h.timestamp}</div>
                            <div style={{ color: "#fff", fontWeight: "bold", fontSize: "13px" }}>{h.symbol}</div>
                            <div style={{ color: sentColor(h.sentiment), fontWeight: "bold" }}>{h.signal}</div>
                            <div style={{ color: "#555", fontSize: "11px" }}>Score: {h.opportunityScore}/100</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!hasResult && !loading && emptyState("🔍", "Ready to Scan",
              "Enter any token symbol or contract address above. ChainPulse AI finds the highest market cap match and returns a full analysis."
            )}
          </>
        )}

        {/* ===================== OPPORTUNITIES ===================== */}
        {activeTab === "opportunities" && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>📈 Opportunities</h1>
                <p style={styles.subtitle}>AI-ranked opportunities across top assets — powered by SoSoValue intelligence</p>
              </div>
              <button onClick={fetchOpportunities} style={{ ...styles.actionBtn, border: "1px solid #1c2a35", color: "#aaa" }} disabled={oppLoading}>
                {oppLoading ? "Loading..." : "🔄 Refresh"}
              </button>
            </div>
            <div style={styles.moduleDesc}>
              The Opportunities module auto-scans the top assets using real market data from CoinGecko and live market intelligence from SoSoValue. Each token is scored 0–100 based on AI sentiment, volume profile, price momentum, and confidence. Higher scores = stronger opportunity signal. This is your AI-powered opportunity discovery engine.
            </div>

            {/* TOP OPPORTUNITIES LEADERBOARD */}
            {oppLoading ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                <div style={{ color: "#aaa" }}>Loading opportunity data...</div>
              </div>
            ) : opportunities.length > 0 ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <div style={styles.cardHeader}>🏆 Top Opportunity Leaderboard</div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                    {opportunities.map((opp, i) => (
                      <div key={opp.id} style={{
                        ...styles.card,
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px 22px",
                        border: i === 0 ? "1px solid #00ff9940" : "1px solid #1c2a35",
                      }}>
                        <div style={{ color: i === 0 ? "#00ff99" : "#555", fontSize: "20px", fontWeight: "bold", width: "28px" }}>
                          #{i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>{opp.name}</span>
                            <span style={{ color: "#555", fontSize: "12px" }}>{opp.symbol}</span>
                            <span style={{ color: sentColor(opp.sentiment), fontSize: "12px", fontWeight: "bold" }}>{opp.signal}</span>
                          </div>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" as const }}>
                            <span style={{ color: "#aaa", fontSize: "12px" }}>Price: <strong style={{ color: "#fff" }}>${opp.price?.toLocaleString()}</strong></span>
                            <span style={{ color: "#aaa", fontSize: "12px" }}>24H: <strong style={{ color: (opp.change24h ?? 0) >= 0 ? "#00ff99" : "#ff4d4f" }}>{opp.change24h >= 0 ? "+" : ""}{opp.change24h?.toFixed(2)}%</strong></span>
                            <span style={{ color: "#aaa", fontSize: "12px" }}>Vol: <strong style={{ color: "#fff" }}>{formatLarge(opp.volume)}</strong></span>
                            <span style={{ color: "#aaa", fontSize: "12px" }}>Confidence: <strong style={{ color: "#fff" }}>{opp.confidence}%</strong></span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <div style={{ textAlign: "center" as const }}>
                            <div style={{ color: "#555", fontSize: "10px", marginBottom: "2px" }}>OPPORTUNITY</div>
                            <div style={{ color: "#00ff99", fontWeight: "bold", fontSize: "20px" }}>{opp.opportunityScore}</div>
                            <div style={styles.scoreBar}>
                              <div style={{ ...styles.scoreBarFill, width: `${opp.opportunityScore}%`, background: "#00ff99" }} />
                            </div>
                          </div>
                          <div style={{ textAlign: "center" as const }}>
                            <div style={{ color: "#555", fontSize: "10px", marginBottom: "2px" }}>RISK</div>
                            <div style={{ color: riskScoreColor(opp.riskScore), fontWeight: "bold", fontSize: "20px" }}>{opp.riskScore}</div>
                            <div style={styles.scoreBar}>
                              <div style={{ ...styles.scoreBarFill, width: `${opp.riskScore}%`, background: riskScoreColor(opp.riskScore) }} />
                            </div>
                          </div>
                          <button
                            onClick={() => { setToken(opp.symbol); setActiveTab("scanner"); runAnalysis(opp.symbol); }}
                            style={{ ...styles.button, padding: "10px 16px", fontSize: "12px" }}>
                            Scan →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* If user also has a scanned token, show its breakdown */}
                {hasResult && (
                  <>
                    <div style={styles.cardHeader}>📊 Your Last Scanned Token</div>
                    <div style={styles.scanResultGrid}>
                      <div style={styles.card}>
                        <div style={styles.cardHeader}>🎯 Opportunity Score</div>
                        <div style={{ fontSize: "64px", fontWeight: "bold", color: "#00ff99", textAlign: "center" as const, margin: "16px 0" }}>
                          {opportunityScore ?? "—"}<span style={{ fontSize: "22px", color: "#666" }}>/100</span>
                        </div>
                        <div style={styles.scoreBar}><div style={{ ...styles.scoreBarFill, width: `${opportunityScore ?? 0}%`, background: "#00ff99" }} /></div>
                        <div style={{ color: "#aaa", textAlign: "center" as const, marginTop: "14px", fontSize: "13px" }}>
                          {(opportunityScore ?? 0) >= 70 ? "🟢 Strong opportunity" : (opportunityScore ?? 0) >= 50 ? "🟡 Moderate opportunity" : "🔴 Low opportunity"}
                        </div>
                      </div>
                      <div style={styles.card}>
                        <div style={styles.cardHeader}>🛡️ Risk Assessment</div>
                        <div style={{ fontSize: "64px", fontWeight: "bold", color: riskScoreColor(riskScore), textAlign: "center" as const, margin: "16px 0" }}>
                          {riskScore ?? "—"}<span style={{ fontSize: "22px", color: "#666" }}>/100</span>
                        </div>
                        <div style={styles.scoreBar}><div style={{ ...styles.scoreBarFill, width: `${riskScore ?? 0}%`, background: riskScoreColor(riskScore) }} /></div>
                        <div style={{ color: riskColor(risk), textAlign: "center" as const, marginTop: "14px", fontWeight: "bold" }}>Risk Level: {risk || "—"}</div>
                      </div>
                      <div style={styles.card}>
                        <div style={styles.cardHeader}>🧠 Signal Breakdown</div>
                        {infoRow("AI Sentiment", sentiment, sentimentColor)}
                        {infoRow("AI Signal", signalLabel, sentimentColor)}
                        {infoRow("Confidence", `${confidence}%`)}
                        {infoRow("24H Price Move", change24hStr, change24hColor)}
                        {infoRow("Volume", formatLarge(volume))}
                        {infoRow("Market Cap", formatLarge(marketCap))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
                <div style={{ color: "#aaa" }}>Click Refresh to load opportunity data</div>
                <button style={{ ...styles.button, marginTop: "20px" }} onClick={fetchOpportunities}>Load Opportunities</button>
              </div>
            )}
          </>
        )}

        {/* ===================== EXECUTION LAYER ===================== */}
        {activeTab === "execution" && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>⚡ Execution Layer</h1>
                <p style={styles.subtitle}>Smart routing to the best platform to trade your scanned token</p>
              </div>
            </div>
            <div style={styles.moduleDesc}>
              The Execution Layer is ChainPulse AI's smart trade routing engine. Once a token is scanned, it automatically detects the token's chain and routes you to the most appropriate exchange — Uniswap for Ethereum, Jupiter for Solana, PancakeSwap for BNB Chain, STON.fi for TON, and Binance for major assets. One click to execute.
            </div>

            {!hasResult ? emptyState("⚡", "No Token Scanned Yet",
              "Scan a token first. ChainPulse AI will detect its chain and route you to the best exchange automatically.",
              "Go to AI Scanner →", "scanner"
            ) : (
              <div style={styles.scanResultGrid}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>🎯 Trade Routing</div>
                  <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
                    <div style={{ color: "#555", fontSize: "11px", letterSpacing: "0.08em", marginBottom: "6px" }}>SELECTED PLATFORM</div>
                    <div style={{ color: "#00ff99", fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>{executionPlatform || "—"}</div>
                    <div style={{ color: "#555", fontSize: "11px", letterSpacing: "0.08em", marginBottom: "6px" }}>DETECTED CHAIN</div>
                    <div style={{ color: "#fff", fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>{chain || "—"}</div>
                    <div style={{ color: "#555", fontSize: "11px", letterSpacing: "0.08em", marginBottom: "6px" }}>STATUS</div>
                    <div style={{ color: "#00ff99", fontSize: "14px", fontWeight: "bold", marginBottom: "28px" }}>✅ EXECUTION READY</div>
                    {executionUrl && (
                      <a href={executionUrl} target="_blank" rel="noreferrer"
                        style={{ ...styles.tradeButton, display: "inline-block", padding: "16px 36px" }}>
                        Execute on {executionPlatform} →
                      </a>
                    )}
                  </div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>🪙 Token Being Traded</div>
                  {infoRow("Asset", `${assetName} (${symbol})`)}
                  {infoRow("Chain", chain)}
                  {infoRow("Current Price", formatPrice(price))}
                  {infoRow("24H Change", change24hStr, change24hColor)}
                  {infoRow("AI Signal", signalLabel, sentimentColor)}
                  {infoRow("Risk Level", risk, riskColor(risk))}
                  {infoRow("Opportunity", opportunityScore !== null ? `${opportunityScore}/100` : "—", "#00ff99")}
                </div>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>🔀 Routing Logic</div>
                  {[
                    ["Ethereum / EVM", "Uniswap", "Largest DEX for ERC-20 tokens"],
                    ["Solana", "Jupiter", "Best price routing on Solana"],
                    ["BNB Chain", "PancakeSwap", "Primary DEX for BEP-20 tokens"],
                    ["TON", "STON.fi", "Leading AMM on The Open Network"],
                    ["Major Assets", "Binance", "Deepest liquidity for large caps"],
                  ].map(([c, p, d]) => (
                    <div key={c} style={{ padding: "10px 0", borderBottom: "1px solid #12202b" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ color: "#aaa", fontSize: "12px" }}>{c}</span>
                        <span style={{ color: "#00ff99", fontSize: "12px", fontWeight: "bold" }}>{p}</span>
                      </div>
                      <div style={{ color: "#555", fontSize: "11px" }}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===================== WATCHLIST ===================== */}
        {activeTab === "watchlist" && (
          <>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>👁️ Watchlist</h1>
                <p style={styles.subtitle}>Monitor and track tokens you care about</p>
              </div>
            </div>
            <div style={styles.moduleDesc}>
              The Watchlist lets you save scanned tokens and monitor them over time. Click "Add to Watchlist" after scanning any token on the Dashboard or AI Scanner. Refresh individual tokens to get updated signals and scores without re-scanning from scratch.
            </div>

            {watchlist.length === 0 ? (
              <>
                {emptyState("👁️", "Your Watchlist is Empty",
                  "Scan any token and click 'Add to Watchlist' to start tracking it here. Your watchlist is saved in your browser.",
                  "Go to AI Scanner →", "scanner"
                )}
                {market.length > 0 && (
                  <div style={{ marginTop: "32px" }}>
                    <div style={{ ...styles.cardHeader, marginBottom: "16px" }}>📊 Live Market — click to scan</div>
                    <div style={styles.tokenGrid}>
                      {market.map((coin) => (
                        <div key={coin.symbol} style={styles.tokenCard}
                          onClick={() => { setToken(coin.symbol); setActiveTab("scanner"); }}>
                          <div style={styles.tokenName}>{coin.symbol}</div>
                          <div style={styles.tokenPrice}>${coin.price}</div>
                          <div style={{ color: Number(coin.change) >= 0 ? "#00ff99" : "#ff4d4f" }}>{coin.change}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
                  {watchlist.map((item) => (
                    <div key={item.symbol} style={{ ...styles.card, display: "flex", alignItems: "center", gap: "16px", padding: "16px 22px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <span style={{ color: "#fff", fontWeight: "bold", fontSize: "16px" }}>{item.name}</span>
                          <span style={{ color: "#555", fontSize: "12px" }}>{item.symbol}</span>
                          <span style={{ color: "#555", fontSize: "11px" }}>{item.chain}</span>
                        </div>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" as const }}>
                          <span style={{ color: "#aaa", fontSize: "12px" }}>Price: <strong style={{ color: "#fff" }}>{formatPrice(item.price)}</strong></span>
                          <span style={{ color: "#aaa", fontSize: "12px" }}>24H: <strong style={{ color: (item.change24h ?? 0) >= 0 ? "#00ff99" : "#ff4d4f" }}>{item.change24h !== null ? `${item.change24h >= 0 ? "+" : ""}${item.change24h.toFixed(2)}%` : "—"}</strong></span>
                          <span style={{ color: "#aaa", fontSize: "12px" }}>Signal: <strong style={{ color: sentColor(item.sentiment) }}>{item.sentiment === "BULLISH" ? "BUY" : item.sentiment === "BEARISH" ? "SELL" : "HOLD"}</strong></span>
                          <span style={{ color: "#aaa", fontSize: "12px" }}>Opportunity: <strong style={{ color: "#00ff99" }}>{item.opportunityScore ?? "—"}/100</strong></span>
                          <span style={{ color: "#aaa", fontSize: "12px" }}>Risk: <strong style={{ color: riskScoreColor(item.riskScore) }}>{item.riskScore ?? "—"}/100</strong></span>
                        </div>
                        <div style={{ color: "#333", fontSize: "11px", marginTop: "4px" }}>Added: {item.addedAt}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => refreshWatchlistItem(item.symbol)}
                          disabled={watchlistLoading === item.symbol}
                          style={{ ...styles.actionBtn, border: "1px solid #1c2a35", color: "#aaa", fontSize: "12px", padding: "8px 14px" }}>
                          {watchlistLoading === item.symbol ? "..." : "🔄"}
                        </button>
                        <button
                          onClick={() => { setToken(item.symbol); setActiveTab("scanner"); runAnalysis(item.symbol); }}
                          style={{ ...styles.actionBtn, border: "1px solid #1c2a35", color: "#00ff99", fontSize: "12px", padding: "8px 14px" }}>
                          Scan
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.symbol)}
                          style={{ ...styles.actionBtn, border: "1px solid #ff4d4f30", color: "#ff4d4f", fontSize: "12px", padding: "8px 14px" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "16px", color: "#555", fontSize: "12px", textAlign: "center" as const }}>
                  {watchlist.length} token{watchlist.length !== 1 ? "s" : ""} in watchlist — saved in browser
                </div>
              </>
            )}
          </>
        )}

      </section>
    </main>
  );
}

/* ========================= STYLES ========================= */
const styles: any = {
  container: { display: "flex", minHeight: "100vh", background: "#050b0f", color: "#fff", fontFamily: "system-ui" },
  sidebar: { width: "240px", background: "#081018", borderRight: "1px solid #12202b", padding: "25px", flexShrink: 0, position: "sticky" as const, top: 0, height: "100vh", display: "flex", flexDirection: "column" as const },
  logo: { color: "#00ff99", marginBottom: "32px", fontSize: "18px" },
  menu: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  menuItem: { padding: "12px 14px", borderRadius: "10px", color: "#aaa", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" },
  menuActive: { padding: "12px 14px", borderRadius: "10px", background: "#00ff9915", color: "#00ff99", fontWeight: "bold", borderLeft: "3px solid #00ff99", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" },
  badge: { marginLeft: "auto", background: "#00ff99", color: "#000", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "bold" },
  scannedBadge: { marginTop: "auto", padding: "14px", background: "#0d151c", borderRadius: "12px", border: "1px solid #1c2a35" },
  content: { flex: 1, padding: "25px", overflowX: "hidden" as const, overflowY: "auto" as const },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { fontSize: "28px", margin: 0 },
  subtitle: { color: "#888", margin: "6px 0 0 0", fontSize: "14px" },
  signalBox: { background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "16px", padding: "20px", minWidth: "200px", textAlign: "center" as const },
  moduleDesc: { background: "#0a1520", border: "1px solid #1c2a35", borderRadius: "12px", padding: "16px 20px", color: "#aaa", fontSize: "13px", lineHeight: "1.8", marginBottom: "24px" },
  tokenGrid: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px", marginBottom: "24px" },
  tokenCard: { background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "14px", padding: "16px", cursor: "pointer" },
  tokenName: { marginBottom: "6px", color: "#aaa", fontSize: "12px" },
  tokenPrice: { fontSize: "16px", fontWeight: "bold", marginBottom: "4px" },
  searchBar: { display: "flex", gap: "12px", marginBottom: "16px" },
  input: { flex: 1, background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "12px", padding: "14px", color: "#fff", fontSize: "14px", outline: "none" },
  button: { background: "#00ff99", border: "none", padding: "14px 28px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", color: "#000" },
  actionRow: { display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" as const },
  actionBtn: { padding: "10px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", background: "#0d151c" },
  multiChainBanner: { background: "#1a1200", border: "1px solid #f5a62360", borderRadius: "12px", padding: "12px 18px", color: "#f5a623", marginBottom: "14px", fontSize: "13px" },
  noteBanner: { background: "#0a1525", border: "1px solid #1c3a5e", borderRadius: "12px", padding: "14px 18px", color: "#7eb8f7", marginBottom: "18px", fontSize: "13px", lineHeight: "1.7" },
  assetStrip: { display: "flex", gap: "10px", flexWrap: "wrap" as const, background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "14px", padding: "16px", marginBottom: "16px" },
  assetStripItem: { display: "flex", flexDirection: "column" as const, gap: "4px", flex: "1 1 auto", minWidth: "75px" },
  assetLabel: { color: "#555", fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.06em" },
  assetValue: { fontWeight: "bold", fontSize: "13px" },
  grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" },
  scanResultGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" },
  card: { background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "18px", padding: "22px" },
  chartCard: { background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "18px", overflow: "hidden" },
  rightPanel: { display: "flex", flexDirection: "column" as const, gap: "18px" },
  cardHeader: { fontSize: "14px", marginBottom: "16px", fontWeight: "bold", color: "#ccc" },
  signalBig: { fontSize: "52px", fontWeight: "bold", marginBottom: "8px" },
  aiText: { color: "#ccc", whiteSpace: "pre-wrap" as const, lineHeight: "1.7", fontSize: "12px", margin: 0, maxHeight: "380px", overflowY: "auto" as const },
  executionInfo: { display: "flex", justifyContent: "space-between", marginBottom: "14px" },
  tradeButton: { display: "block", background: "#00ff99", color: "#000", padding: "14px", textAlign: "center" as const, borderRadius: "12px", textDecoration: "none", fontWeight: "bold" },
  sourceRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", marginBottom: "8px" },
  scoreRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  scoreBar: { background: "#1c2a35", borderRadius: "6px", height: "8px", overflow: "hidden", minWidth: "60px" },
  scoreBarFill: { height: "100%", borderRadius: "6px", transition: "width 0.5s ease" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #0d1f2d" },
  emptyState: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: "280px", background: "#0d151c", border: "1px solid #1c2a35", borderRadius: "18px", padding: "40px" },
};
