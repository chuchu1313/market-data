const express = require('express');
const ccxt = require('ccxt');
const { MACD, RSI, EMA } = require('technicalindicators');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const exchange = new ccxt.binance();

app.use(express.json());
app.get('/', async (req, res) => {
    res.writeHead(200);
    res.end('OK 200');
});

app.post('/api/market-data', async (req, res) => {
    try {
        const symbols = req.body.symbols || [
            "BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOGE", "DOT", "MATIC", "LTC",
            "TRX", "AVAX", "UNI", "XLM", "ATOM", "LINK", "ETC", "FIL", "ALGO", "VET",
            "ICP", "NEAR", "MKR", "QNT", "FTM", "THETA", "XEC", "EGLD", "HBAR", "SAND",
            "XTZ", "AXS", "APE", "RUNE", "AAVE", "MANA", "GALA", "EOS", "FLOW", "KLAY"
        ];
        const resp = await axios.get('https://www.binance.com/bapi/apex/v1/public/apex/marketing/symbol/list');
        const symbolList = resp.data.data;
        const timeframe = req.body.timeframe || '5m';
        const limit = req.body.limit || 50;

        const marketDataPromises = symbols.map(async (baseAsset) => {
            try {
                const symbol = baseAsset + "/USDT";
                const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
                const timestamps = ohlcv.map(candle => new Date(candle[0]).toISOString());
                const closes = ohlcv.map(candle => candle[4]);

                // ** calculate EMA
                const ema12 = EMA.calculate({ values: closes, period: 12 });
                const ema26 = EMA.calculate({ values: closes, period: 26 });

                // ** calculate MACD**
                const macdInput = { values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
                const macdResult = MACD.calculate(macdInput);

                // ** calculate RSI **
                const rsiResult = RSI.calculate({ values: closes, period: 14 });

                const minDataSize = Math.min(macdResult.length, rsiResult.length, ema12.length, ema26.length, closes.length);
                const sliceSize = Math.max(35, minDataSize);

                const macdArray = macdResult.slice(-sliceSize).map(val => [val.MACD, val.signal, val.histogram]);
                const rsiArray = rsiResult.slice(-sliceSize);
                const ema12Array = ema12.slice(-sliceSize);
                const ema26Array = ema26.slice(-sliceSize);

                const assetData = _.find(symbolList, { symbol: `${baseAsset}USDT` })
                return {
                    symbol,
                    marketCap: assetData.marketCap,
                    volume: assetData.volume,
                    dayChange: assetData.dayChange,
                    price: assetData.price,
                    timeframe,
                    timestamp: timestamps.slice(-sliceSize),
                    ohlcv: ohlcv.slice(-sliceSize).map(candle => candle.slice(1, 6)), // 取 open, high, low, close, volume
                    indicators: {
                        ema_12: ema12Array,
                        ema_26: ema26Array,
                        macd: macdArray,
                        rsi: rsiArray,
                    }
                };
            } catch (error) {
                return { symbol: baseAsset, error: error.message };
            }
        });

        const marketData = await Promise.all(marketDataPromises);

        res.json(marketData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);

app.on('SIGTERM', () => app.close());
