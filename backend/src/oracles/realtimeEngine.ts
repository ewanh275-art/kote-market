import axios from 'axios';
import { settleMarketOnChain } from '../blockchain/tonSettler';

interface ActiveMarket {
  poolAddress: string;
  type: 'crypto' | 'sports';
  symbol?: string; // e.g., 'bitcoin' for CoinGecko
  fixtureId?: number; // for sports API
  targetValue?: number;
  expectedOutcome?: boolean;
  status: 'active' | 'resolved';
}

// In-memory store or fetched from your database/contracts
let activeMarkets: ActiveMarket[] = [];

export function registerMarketForMonitoring(market: ActiveMarket) {
  activeMarkets.push(market);
  console.log(`[Oracle] Registered market for monitoring: ${market.poolAddress} (${market.type})`);
}

export function startRealtimeEngine() {
  console.log('[Oracle] Starting Realtime Oracle Engine...');

  // Run the polling check every 30 seconds
  setInterval(async () => {
    if (activeMarkets.length === 0) return;

    console.log(`[Oracle] Checking ${activeMarkets.length} active markets...`);

    for (const market of activeMarkets) {
      if (market.status === 'resolved') continue;

      try {
        if (market.type === 'crypto' && market.symbol) {
          await checkCryptoMarket(market);
        } else if (market.type === 'sports' && market.fixtureId) {
          await checkSportsMarket(market);
        }
      } catch (err: any) {
        console.error(`[Oracle Error] Failed to evaluate market ${market.poolAddress}:`, err.message);
      }
    }
  }, 30000);
}

async function checkCryptoMarket(market: ActiveMarket) {
  const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
    params: {
      ids: market.symbol,
      vs_currencies: 'usd',
    },
  });

  const currentPrice = response.data[market.symbol!]?.usd;
  if (!currentPrice) return;

  console.log(`[Crypto Oracle] ${market.symbol} current price: $${currentPrice} (Target: $${market.targetValue})`);

  if (market.targetValue && currentPrice >= market.targetValue) {
    const outcome = true;
    console.log(`[Crypto Oracle] Market condition met! Settling on-chain...`);
    
    await settleMarketOnChain(market.poolAddress, outcome);
    market.status = 'resolved';
  }
}

async function checkSportsMarket(market: ActiveMarket) {
  const apiKey = process.env.SPORTS_API_KEY as string;
  if (!apiKey) {
    console.warn('[Sports Oracle] SPORTS_API_KEY is not defined in environment variables.');
    return;
  }

  const response = await axios.get(`https://v3.football.api-sports.io/fixtures`, {
    params: { id: market.fixtureId },
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  const fixture = response.data.response?.[0];
  if (!fixture) return;

  const matchStatus = fixture.fixture.status.short; // e.g., 'FT' for Full Time

  if (matchStatus === 'FT') {
    const homeGoals = fixture.goals.home;
    const awayGoals = fixture.goals.away;
    
    // Example condition: Home team wins
    const outcome = homeGoals > awayGoals;

    console.log(`[Sports Oracle] Match finished. Home: ${homeGoals}, Away: ${awayGoals}. Settling on-chain...`);

    await settleMarketOnChain(market.poolAddress, outcome);
    market.status = 'resolved';
  }
}
