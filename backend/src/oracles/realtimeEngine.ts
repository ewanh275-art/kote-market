import axios from 'axios';
import { settleMarketOnChain } from '../blockchain/tonSettler';

interface MarketTarget {
  poolAddress: string;
  type: 'crypto';
  symbol: string;
  targetValue: number;
  status: 'active' | 'settled';
}

// In-memory active market monitoring queue
const activeMarkets: MarketTarget[] = [];

/**
 * Registers a new prediction market into the oracle monitoring queue.
 */
export function registerMarketForMonitoring(market: MarketTarget) {
  const existing = activeMarkets.find((m) => m.poolAddress === market.poolAddress);
  if (!existing) {
    activeMarkets.push(market);
    console.log(`[Oracle Engine] Registered market for monitoring: Pool ${market.poolAddress} (${market.symbol} target: $${market.targetValue})`);
  }
}

/**
 * Returns all active/settled markets for frontend consumption.
 */
export function getActiveMarkets() {
  return activeMarkets;
}

// Polling loop running every 30 seconds to evaluate active markets
setInterval(async () => {
  if (activeMarkets.length === 0) return;

  console.log(`[Oracle Engine] Checking ${activeMarkets.length} active markets...`);

  for (const market of activeMarkets) {
    if (market.status !== 'active') continue;

    try {
      if (market.type === 'crypto') {
        let currentPrice: number | null = null;
        try {
          const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: { ids: market.symbol, vs_currencies: 'usd' },
          });
          currentPrice = res.data?.[market.symbol]?.usd;
        } catch (cgErr: any) {
          console.warn(`[Oracle Engine] CoinGecko rate-limited or failed for ${market.symbol}: ${cgErr.message}`);
          continue;
        }

        if (!currentPrice) continue;

        console.log(`[Crypto Oracle] ${market.symbol} current price: $${currentPrice} (Target: $${market.targetValue})`);

        if (currentPrice >= market.targetValue) {
          console.log(`[Crypto Oracle] Target met for pool ${market.poolAddress}! Triggering on-chain settlement...`);
          
          try {
            await settleMarketOnChain(market.poolAddress, 'bullish_win');
            market.status = 'settled';
            console.log(`[Crypto Oracle] Successfully marked pool ${market.poolAddress} as settled.`);
          } catch (settleErr: any) {
            console.error(`[Crypto Oracle Error] Failed to settle pool ${market.poolAddress} on-chain:`, settleErr.message);
          }
        }
      }
    } catch (err: any) {
      console.error(`[Oracle Engine Error] Failed to evaluate market ${market.poolAddress}:`, err.message);
    }
  }
}, 30000);
