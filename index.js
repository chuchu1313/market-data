const express = require('express');
const ccxt = require('ccxt');
const { MACD, RSI, EMA } = require('technicalindicators');

const app = express();
const exchange = new ccxt.binance();

app.use(express.json())
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
        const timeframe = req.body.timeframe || '5m';
        const limit = req.body.limit || 50;

        const marketDataPromises = symbols.map(async (symbol) => {
            try {
                symbol = symbol + "/USDT";
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

                const macdFormatted = macdResult.slice(-sliceSize).map((val) => ({
                    MACD: val.MACD,
                    signal: val.signal,
                    histogram: val.histogram
                }));

                return {
                    symbol,
                    timeframe,
                    timestamp: timestamps.slice(-sliceSize),
                    ohlcv: ohlcv.slice(-sliceSize).map(candle => candle.slice(1, 6)), // 取 open, high, low, close, volume
                    indicators: {
                        ema_12: ema12.slice(-sliceSize),
                        ema_26: ema26.slice(-sliceSize),
                        macd: macdFormatted,
                        rsi: rsiResult.slice(-sliceSize),
                    }
                };
            } catch (error) {
                return { symbol, error: error.message };
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
