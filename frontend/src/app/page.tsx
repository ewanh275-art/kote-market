'use client';

import { useEffect, useState } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, Address, toNano } from '@ton/core';
import { io } from 'socket.io-client';

interface Market {
  id: string;
  category: 'CRYPTO' | 'SPORTS' | 'NEWS' | 'POLITICS';
  question: string;
  poolAddress: string;
  yesPercent: number;
  status: 'LIVE' | 'LOCKED' | 'RESOLVED';
  outcome?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function KoteMarketApp() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [wagerAmount, setWagerAmount] = useState<string>('10');
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  useEffect(() => {
    fetch(`${API_URL}/api/markets`)
      .then((res) => res.json())
      .then((data) => setMarkets(data));

    const socket = io(API_URL);
    socket.on('market_update', (updated: Market) => {
      setMarkets((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const placeGramBet = async (market: Market, sideYes: boolean) => {
    if (!userAddress) {
      tonConnectUI.openModal();
      return;
    }

    // Build forward payload: 1 bit indicating YES (1) or NO (0)
    const forwardPayload = beginCell().storeBit(sideYes).endCell();

    // Standard TIP-3 Jetton Transfer Body to send $GRAM to the Market Pool
    const jettonTransferBody = beginCell()
      .storeUint(0xf8a7ea5, 32) // Jetton transfer opcode
      .storeUint(0, 64) // query_id
      .storeCoins(toNano(wagerAmount)) // $GRAM amount
      .storeAddress(Address.parse(market.poolAddress)) // Destination PredictionPool
      .storeAddress(Address.parse(userAddress)) // Excess gas return address
      .storeBit(0) // No custom payload
      .storeCoins(toNano('0.05')) // Forward TON for contract execution
      .storeBit(1) // Forward payload as reference
      .storeRef(forwardPayload)
      .endCell();

    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          // Replace with the user's resolved $GRAM Jetton Wallet address in production
          address: process.env.NEXT_PUBLIC_GRAM_MASTER_ADDRESS || market.poolAddress,
          amount: toNano('0.1').toString(),
          payload: jettonTransferBody.toBoc().toString('base64'),
        },
      ],
    });
  };

  const filtered = activeTab === 'ALL' ? markets : markets.filter((m) => m.category === activeTab);

  return (
    <main className="max-w-md mx-auto p-4 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-amber-400">KOTE MARKET</h1>
          <p className="text-xs text-zinc-400">Real-Time $GRAM Predictions</p>
        </div>
        <TonConnectButton />
      </header>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {['ALL', 'CRYPTO', 'SPORTS', 'NEWS', 'POLITICS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1.5 rounded-full transition ${
              activeTab === cat ? 'bg-amber-400 text-black' : 'bg-zinc-900 text-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Wager Input */}
      <div className="bg-zinc-900 p-3 rounded-xl flex items-center justify-between border border-zinc-800">
        <span className="text-xs text-zinc-400">Wager Amount ($GRAM)</span>
        <input
          type="number"
          value={wagerAmount}
          onChange={(e) => setWagerAmount(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1 w-24 text-right font-bold text-amber-400"
        />
      </div>

      {/* Market Cards */}
      <div className="space-y-4">
        {filtered.map((market) => (
          <div key={market.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-medium">
                {market.category}
              </span>
              <span className={market.status === 'LIVE' ? 'text-emerald-400' : 'text-rose-400'}>
                {market.status === 'LIVE' ? '● LIVE' : `ENDED (${market.outcome ? 'YES' : 'NO'})`}
              </span>
            </div>

            <h2 className="font-bold text-base leading-snug">{market.question}</h2>

            {/* Probability Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400">YES {market.yesPercent}%</span>
                <span className="text-rose-400">NO {100 - market.yesPercent}%</span>
              </div>
              <div className="w-full h-2 bg-rose-500/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${market.yesPercent}%` }}
                />
              </div>
            </div>

            {/* Bet Buttons */}
            {market.status === 'LIVE' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => placeGramBet(market, true)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl font-bold text-sm"
                >
                  Bet YES
                </button>
                <button
                  onClick={() => placeGramBet(market, false)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-2 rounded-xl font-bold text-sm"
                >
                  Bet NO
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
