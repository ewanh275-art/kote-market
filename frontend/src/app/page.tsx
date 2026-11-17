'use client';

import { useState, useEffect } from 'react';

interface Market {
  id: string;
  category: 'crypto' | 'sports' | 'news';
  title: string;
  symbol: string;
  targetValue: number;
  yesOdds: number;
  noOdds: number;
  poolAddress: string;
  status: 'active' | 'settled';
}

export default function Home() {
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'crypto' | 'sports' | 'news'>('crypto');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [wagerAmount, setWagerAmount] = useState<string>('1');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');

  const fallbackMarkets: Market[] = [
    { id: '1', category: 'crypto', title: 'Bitcoin above $100,000 by end of Q3?', symbol: 'BTC', targetValue: 100000, yesOdds: 74, noOdds: 26, poolAddress: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', status: 'active' },
    { id: '2', category: 'crypto', title: 'Toncoin (TON) breaks $8.50 this month?', symbol: 'TON', targetValue: 8.5, yesOdds: 58, noOdds: 42, poolAddress: 'EQA123...mockPool', status: 'active' },
    { id: '3', category: 'sports', title: 'Champions League: Real Madrid to win semi-final match?', symbol: 'UCL', targetValue: 1, yesOdds: 65, noOdds: 35, poolAddress: 'EQB456...mockPool', status: 'active' },
    { id: '4', category: 'news', title: 'Global interest rate cuts announced by Fed in next meeting?', symbol: 'MACRO', targetValue: 1, yesOdds: 40, noOdds: 60, poolAddress: 'EQC789...mockPool', status: 'active' },
  ];

  const BACKEND_URL = 'https://kote-backend.onrender.com';

  useEffect(() => {
    async function fetchBackendMarkets() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/markets`);
        const data = await res.json();
        if (data.success && data.markets.length > 0) {
          const formatted = data.markets.map((m: any, idx: number) => ({
            id: String(idx + 1),
            category: 'crypto' as const,
            title: `${m.symbol.toUpperCase()} hits target $${m.targetValue.toLocaleString()}?`,
            symbol: m.symbol.toUpperCase(),
            targetValue: m.targetValue,
            yesOdds: 50,
            noOdds: 50,
            poolAddress: m.poolAddress,
            status: m.status
          }));
          setMarkets([...formatted, ...fallbackMarkets]);
        } else {
          setMarkets(fallbackMarkets);
        }
      } catch (err) {
        setMarkets(fallbackMarkets);
      } finally {
        setLoading(false);
      }
    }
    fetchBackendMarkets();
  }, []);
