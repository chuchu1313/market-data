# Market Data API

This project is a simple **Express.js** API that retrieves cryptocurrency market data from **Binance** using the `ccxt` library and calculates technical indicators such as **MACD, RSI, and SMA(50)** using the `technicalindicators` library.

## 📌 Features
- Fetches **OHLCV** (Open, High, Low, Close, Volume) data for a given trading pair.
- Computes **MACD (Moving Average Convergence Divergence)**.
- Computes **RSI (Relative Strength Index)**.
- Computes **SMA(50) (Simple Moving Average - 50 periods)**.
- Supports query parameters for **symbol** and **timeframe**.

## 📦 Installation

### **1️⃣ Prerequisites**
Ensure you have **Node.js** installed on your system.

### **2️⃣ Clone the Repository**
```sh
git clone https://github.com/your-repo/market-data-api.git
cd market-data-api
```

### **3️⃣ Install Dependencies**
```sh
npm install
```

## 🚀 Running the API
```sh
node server.js
```
The API will start and listen on **port 3000**.

## 📡 API Endpoints

### **1️⃣ Health Check**
Check if the server is running:
```sh
GET /
```
✅ **Response:**
```
OK
```

### **2️⃣ Fetch Market Data & Indicators**
Fetch **OHLCV** data along with **MACD, RSI, and SMA(50)**.
```sh
GET /api/market-data?symbol=BTC/USDT&timeframe=5m
```

#### 🔹 **Query Parameters**
| Parameter  | Type   | Default   | Description                          |
|------------|--------|-----------|--------------------------------------|
| `symbol`   | String | `BTC/USDT` | The trading pair to fetch data for. |
| `timeframe`| String | `5m`       | The time interval for OHLCV data.   |

#### 🔹 **Response Example**
```json
{
  "symbol": "BTC/USDT",
  "timeframe": "5m",
  "timestamp": [
    "2025-03-17T02:30:00.000Z",
    "2025-03-17T02:35:00.000Z"
  ],
  "ohlcv": [
    [83268.34, 83280.11, 83188.31, 83224.54, 24.02651],
    [83224.54, 83262.5, 83185.27, 83262.49, 10.24202]
  ],
  "indicators": {
    "macd": [
      { "MACD": 132.59, "signal": 152.98, "histogram": -20.39 },
      { "MACD": 130.61, "signal": 148.51, "histogram": -17.89 }
    ],
    "rsi": [62.85, 64.34],
    "sma_50": [82942.25, 83000.10]
  }
}
```

## 🔧 Technical Details
- **Express.js** for API framework.
- **CCXT** for retrieving market data from Binance.
- **TechnicalIndicators** for computing MACD, RSI, and SMA(50).

