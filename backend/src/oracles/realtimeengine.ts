import axios from 'axios';
import { Server } from 'socket.io';
import { settleMarketOnChain } from '../blockchain/tonSettler';

export interface Market {
  id: string;
  category: 'CRYPTO' | 'SPORTS' | 'NEWS' | 'POLITICS';
  question: string;
  poolAddress: string;
  externalEventId: string; // e.g., API-Football fixture ID or Pyth symbol
  targetValue?: number;
  endTime: number;
  yesPercent: number;
  status: 'LIVE' | 'LOCKED' | 'RESOLVED';
  outcome?: boolean;
}

export const activeMarkets: Market[] = [
  {
    id: 'mkt-1',
    category: 'SPORTS',
    question: 'Man City to beat Liverpool (Full Time)?',
    poolAddress: 'EQC_YOUR_DEPLOYED_POOL_ADDRESS_1',
    externalEventId: '1208021', // Fixture ID
    endTime: Date.now() + 5400000,
    yesPercent: 54,
    status: 'LIVE',
  },
  {
    id: 'mkt-2',
    category: 'CRYPTO',
    question: 'BTC above $95,000 at 20:00 UTC?',
    poolAddress: 'EQC_YOUR_DEPLOYED_POOL_ADDRESS_2',
    externalEventId: 'BTCUSDT',
    targetValue: 95000,
    endTime: Date.now() + 3600000,
    yesPercent: 62,
    status: 'LIVE',
  },
];

export function startRealtimeOracle(io: Server) {
  setInterval(async () => {
    for (const market of activeMarkets) {
      if (market.status !== 'LIVE') continue;

      try {
        // 1. REAL-TIME SPORTS SETTLEMENT (Ends exact second match hits Full Time)
        if (market.category === 'SPORTS' && process.env.SPORTS_API_KEY) {
          const res = await axios.get(
            `https://v3.football.api-sports.io/fixtures?id=${market.externalEventId}`,
            { headers: { 'x-apisports-key': process.env.SPORTS_API_KEY } }
          );
          const fixture = res.data?.response?.[0];
          const matchStatus = fixture?.fixture?.status?.short;

          // 'FT' = Full Time, 'AET' = After Extra Time, 'PEN' = Penalties
          if (['FT', 'AET', 'PEN'].includes(matchStatus)) {
            const homeWon = fixture.teams.home.winner === true;
            market.status = 'RESOLVED';
            market.outcome = homeWon;
            await settleMarketOnChain(market.poolAddress, homeWon);
            io.emit('market_update', market);
          }
        }

        // 2. REAL-TIME CRYPTO SETTLEMENT (Ends exact second timestamp expires)
        if (market.category === 'CRYPTO' && Date.now() >= market.endTime) {
          const priceRes = await axios.get(
            `https://api.binance.com/api/v3/ticker/price?symbol=${market.externalEventId}`
          );
          const currentPrice = parseFloat(priceRes.data.price);
          const outcome = currentPrice >= (market.targetValue || 0);

          market.status = 'RESOLVED';
          market.outcome = outcome;
          await settleMarketOnChain(market.poolAddress, outcome);
          io.emit('market_update', market);
        }
      } catch (err) {
        console.error(`Oracle error for ${market.id}:`, err);
      }
    }
  }, 5000); // Checks every 5 seconds
}
