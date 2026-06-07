# ⚡ ChainPulse AI

AI-powered multi-chain crypto execution terminal built with SoSoValue API and CoinGecko.

---

## 🚀 What it does

ChainPulse AI transforms real-time crypto market data into actionable intelligence using AI-powered sentiment analysis, opportunity scoring, smart execution routing, and live market insights from SoSoValue.

Users can:
- Scan any crypto token by symbol or contract address across all chains
- View live TradingView market charts
- Read AI-generated market intelligence powered by SoSoValue headlines
- Detect bullish/bearish sentiment with confidence scoring
- Discover top opportunities via AI-ranked leaderboard
- Execute trades via smart DEX/CEX routing
- Monitor tokens live with auto-refresh every 60 seconds
- Save tokens to a personal watchlist

---

## 🧩 The problem it solves

Crypto market information is scattered across charts, news platforms, analytics tools, and multiple DEX interfaces across different chains. Traders struggle to quickly understand sentiment, discover opportunities, and know where to execute a trade.

ChainPulse AI solves this by combining:
- Real-time market data
- AI sentiment analysis powered by SoSoValue intelligence
- Opportunity scoring and risk assessment
- Smart multi-chain execution routing
- Live monitoring and watchlist tracking

into one unified agentic terminal.

---

## 🛠️ Technologies Used

### Frontend
- Next.js
- React
- TradingView Widget

### Backend
- Node.js
- Express.js
- Axios

### APIs
- SoSoValue API — live market intelligence and news headlines
- CoinGecko API — real-time price, market cap, volume, chain detection
- Binance API — live ticker for dashboard market strip

---

## 🏗️ How we built it

1. Backend fetches live market intelligence headlines from SoSoValue API
2. CoinGecko API provides real-time price, volume, market cap, and chain data
3. AI sentiment engine processes SoSoValue headlines and price momentum to generate BUY/SELL/HOLD signals
4. Opportunity Score (0–100) and Risk Score (0–100) are calculated per token
5. Smart execution router detects token chain and routes to the correct DEX or CEX
6. Frontend displays live charts, structured insights, scores, and watchlist across 5 module tabs

---

## ⚡ Features

- Live TradingView charts (loads for every token scanned)
- AI sentiment analysis (BULLISH / BEARISH / NEUTRAL)
- Dynamic token search — symbol or contract address
- Real-time SoSoValue market intelligence integration
- Confidence scoring per signal
- Opportunity Score leaderboard (auto-ranked top assets)
- Risk Score and Risk Level per token
- Multi-chain detection with highest market cap matching
- Smart execution routing (Uniswap, Jupiter, PancakeSwap, STON.fi, Binance)
- Live Monitor — auto-rescan every 60 seconds
- Signal History — last 5 scans logged with timestamps
- Watchlist — save, refresh, and track tokens in browser
- Copy Report — one-click full analysis export
- 5 module tabs: Dashboard, AI Scanner, Opportunities, Execution Layer, Watchlist

---

## 📦 Installation

### Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/chainpulse-ai.git
```

---

## Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
SOSO_API_KEY=YOUR_SOSOVALUE_API_KEY
CG_API_KEY=YOUR_COINGECKO_DEMO_API_KEY
```

Start backend:

```bash
node server.js
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔮 Future Improvements

- Portfolio analytics and P&L tracking
- Price alerts and push notifications
- SoDEX integration for on-chain index data
- Smart money wallet tracking
- AI explanation engine with deeper reasoning
- Mobile-responsive layout
- Multi-wallet connect and on-chain execution

---

## 🏆 Built For

SoSoValue Buildathon 2026

Built by Katty Labs.
