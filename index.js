const express = require('express');
const ccxt = require('ccxt');
const { MACD, RSI, SMA } = require('technicalindicators');

const app = express();
const exchange = new ccxt.binance();

app.get('/api/market-data', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTC/USDT';
        const timeframe = req.query.timeframe || '5m';
        const limit = 50; // 确保获取足够的数据

        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
        const timestamps = ohlcv.map(candle => new Date(candle[0]).toISOString());
        const closes = ohlcv.map(candle => candle[4]);

        // 计算 MACD
        const macdInput = { values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
        const macdResult = MACD.calculate(macdInput);

        // calculate RSI
        const rsiResult = RSI.calculate({ values: closes, period: 14 });

        // calculate SMA(50)
        const sma50Result = SMA.calculate({ values: closes, period: 50 });

        const minDataSize = Math.min(macdResult.length, rsiResult.length, closes.length);

        // get recent 35 data points
        const sliceSize = Math.max(35, minDataSize);
        const macdFormatted = macdResult.slice(-sliceSize).map((val) => ({
            MACD: val.MACD,
            signal: val.signal,
            histogram: val.histogram
        }));

        res.json({
            symbol,
            timeframe,
            timestamp: timestamps.slice(-sliceSize),
            ohlcv: ohlcv.slice(-sliceSize).map(candle => candle.slice(1, 6)), // 取 open, high, low, close, volume
            indicators: {
                macd: macdFormatted,
                rsi: rsiResult.slice(-sliceSize),
                sma_50: sma50Result.slice(-sliceSize)
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);

app.on('SIGTERM', () => app.close());
