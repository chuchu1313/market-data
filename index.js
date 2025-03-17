const express = require('express');
const ccxt = require('ccxt');
const { MACD, RSI, SMA } = require('technicalindicators');

const app = express();
const exchange = new ccxt.binance();

app.use(express.json())
app.get('/', async (req, res) => {
    res.writeHead(200);
    res.end('OK 200');
});

app.post('/api/market-data', async (req, res) => {
    try {
        // 获取多个 symbol，以逗号分隔（如 `BTC/USDT,ETH/USDT`）
        const symbols = req.body.symbols ||  ['BTC'];
        const timeframe = req.query.timeframe || '5m';
        const limit = 50; // 确保获取足够的数据

        // 并行获取多个交易对的数据
        const marketDataPromises = symbols.map(async (symbol) => {
            try {
                symbol = symbol+ "/USDT";
                const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
                const timestamps = ohlcv.map(candle => new Date(candle[0]).toISOString());
                const closes = ohlcv.map(candle => candle[4]);

                // 计算 MACD
                const macdInput = { values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
                const macdResult = MACD.calculate(macdInput);

                // 计算 RSI
                const rsiResult = RSI.calculate({ values: closes, period: 14 });

                // 计算 SMA(50)
                const sma50Result = SMA.calculate({ values: closes, period: 50 });

                const minDataSize = Math.min(macdResult.length, rsiResult.length, closes.length);

                // 取最近 35 根数据
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
                        macd: macdFormatted,
                        rsi: rsiResult.slice(-sliceSize),
                        sma_50: sma50Result.slice(-sliceSize)
                    }
                };
            } catch (error) {
                return { symbol, error: error.message };
            }
        });

        // 等待所有交易对的数据获取完成
        const marketData = await Promise.all(marketDataPromises);

        res.json(marketData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);

app.on('SIGTERM', () => app.close());
