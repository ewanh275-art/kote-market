import express, { Request, Response } from 'express';
import axios from 'axios';
import { registerMarketForMonitoring } from './oracles/realtimeEngine';
import { verifyTonConnection } from './blockchain/tonSettler';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Health check endpoint for Render
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'online', service: 'KOTE Market Backend Oracle' });
});

// Comprehensive test endpoint to verify External APIs & TON Blockchain connectivity
app.get('/api/test-oracle', async (req: Request, res: Response) => {
  try {
    // 1. Test External API (CoinGecko)
    const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'bitcoin', vs_currencies: 'usd' },
    });
    const btcPrice = cgRes.data?.bitcoin?.usd;

    // 2. Test TON Blockchain RPC Connection
    const tonStatus = await verifyTonConnection();

    // 3. Register a dry-run mock market into the Realtime Engine
    registerMarketForMonitoring({
      poolAddress: 'EQ_DRY_RUN_TEST_POOL',
      type: 'crypto',
      symbol: 'bitcoin',
      targetValue: 9999999, // Set high so it safely logs without triggering accidental real settlement
      status: 'active',
    });

    res.status(200).json({
      success: true,
      externalApi: { status: 'OK', btcPriceUsd: btcPrice },
      tonBlockchain: tonStatus,
      oracleQueue: 'Mock market registered successfully. Check Render logs in 30s for the polling loop output.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] KOTE Oracle backend running and listening on port ${PORT}`);
});
