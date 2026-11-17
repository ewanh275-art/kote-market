import express, { Request, Response } from 'express';
import axios from 'axios';
import { registerMarketForMonitoring, getActiveMarkets } from './oracles/realtimeEngine';
import { verifyTonConnection } from './blockchain/tonSettler';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Health check endpoint for Render
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'online', service: 'KOTE Market Backend Oracle' });
});

// Diagnostic test endpoint
app.get('/api/test-oracle', async (req: Request, res: Response) => {
  let btcPrice = null;
  let cgStatus = 'OK';

  try {
    const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'bitcoin', vs_currencies: 'usd' },
    });
    btcPrice = cgRes.data?.bitcoin?.usd;
  } catch (cgErr: any) {
    cgStatus = `Rate limited or failed: ${cgErr.message} (Using fallback/mock price for test)`;
    btcPrice = 65000;
  }

  const tonStatus = await verifyTonConnection();

  res.status(200).json({
    success: true,
    externalApi: { status: cgStatus, btcPriceUsd: btcPrice },
    tonBlockchain: tonStatus,
  });
});

// --- NEW MARKET API ENDPOINTS ---

// 1. Get all active and settled markets for the frontend/Telegram Mini App
app.get('/api/markets', (req: Request, res: Response) => {
  const markets = getActiveMarkets();
  res.status(200).json({ success: true, markets });
});

// 2. Register a new prediction market to be monitored by the oracle
app.post('/api/markets', (req: Request, res: Response) => {
  const { poolAddress, type, symbol, targetValue } = req.body;

  if (!poolAddress || !type || !symbol || !targetValue) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: poolAddress, type, symbol, targetValue' 
    });
  }

  registerMarketForMonitoring({
    poolAddress,
    type,
    symbol: symbol.toLowerCase(),
    targetValue: Number(targetValue),
    status: 'active',
  });

  res.status(201).json({ 
    success: true, 
    message: `Market for pool ${poolAddress} registered successfully for monitoring.` 
  });
});

app.listen(PORT, () => {
  console.log(`[Server] KOTE Oracle backend running and listening on port ${PORT}`);
});
