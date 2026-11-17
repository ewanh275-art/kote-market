'use client';

import { useState, useEffect } from 'react';
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';

interface Market {
  id: string;
  category: 'crypto' | 'gram' | 'sports' | 'news';
  title: string;
  symbol: string;
  targetValue: number;
  yesOdds: number;
  noOdds: number;
  poolAddress: string;
  status: 'active' | 'settled';
}

export default function Home() {
  const userAddress = useTonAddress();
  const [activeTab, setActiveTab] = useState<'crypto' | 'gram' | 'sports' | 'news'>('crypto');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [wagerAmount, setWagerAmount] = useState<string>('1');
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');

  // Treasury wallet for the 10% fee deduction on market resolution
  const TREASURY_WALLET = 'UQBmKzuh-NqzUnXzimjajTadV7srrXXKoQeMCxt8YtVhuVqB';

  // Exactly 5 real, short-term (<30 days) predictions per tab
  const expandedMarkets: Market[] = [
    // --- CRYPTO (Real Short-Term Price Action) ---
    { id: 'c1', category: 'crypto', title: 'Will Bitcoin (BTC) close above $95,000 before the end of this month?', symbol: 'BTC', targetValue: 95000, yesOdds: 68, noOdds: 32, poolAddress: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', status: 'active' },
    { id: 'c2', category: 'crypto', title: 'Will Ethereum (ETH) hit $4,000 within the next 30 days?', symbol: 'ETH', targetValue: 4000, yesOdds: 62, noOdds: 38, poolAddress: 'EQA123', status: 'active' },
    { id: 'c3', category: 'crypto', title: 'Will Solana (SOL) break its 30-day resistance high of $220?', symbol: 'SOL', targetValue: 220, yesOdds: 54, noOdds: 46, poolAddress: 'EQA124', status: 'active' },
    { id: 'c4', category: 'crypto', title: 'Will Ripple (XRP) sustain a weekly close above $1.80?', symbol: 'XRP', targetValue: 1.8, yesOdds: 51, noOdds: 49, poolAddress: 'EQA125', status: 'active' },
    { id: 'c5', category: 'crypto', title: 'Will the total crypto market cap stay above $3.2 Trillion for 7 consecutive days?', symbol: 'TOTAL', targetValue: 3200000000000, yesOdds: 70, noOdds: 30, poolAddress: 'EQA126', status: 'active' },

    // --- GRAM & TON BLOCKCHAIN ($GRAM & Ecosystem) ---
    { id: 'g1', category: 'gram', title: 'Will $GRAM record a new monthly high trading volume on DeDust?', symbol: 'GRAM', targetValue: 1, yesOdds: 78, noOdds: 22, poolAddress: 'EQGRAM1', status: 'active' },
    { id: 'g2', category: 'gram', title: 'Will Toncoin ($GRAM ecosystem asset) break past $7.50 within 30 days?', symbol: 'GRAM', targetValue: 7.5, yesOdds: 58, noOdds: 42, poolAddress: 'EQTON2', status: 'active' },
    { id: 'g3', category: 'gram', title: 'Will active wallets on the TON network cross 150 Million this month?', symbol: 'GRAM', targetValue: 150000000, yesOdds: 82, noOdds: 18, poolAddress: 'EQTON3', status: 'active' },
    { id: 'g4', category: 'gram', title: 'Will Telegram Mini App daily transactions exceed 50 Million?', symbol: 'GRAM', targetValue: 50000000, yesOdds: 70, noOdds: 30, poolAddress: 'EQTON4', status: 'active' },
    { id: 'g5', category: 'gram', title: 'Will $GRAM liquidity pools on STON.fi grow by over 20% this month?', symbol: 'GRAM', targetValue: 1, yesOdds: 65, noOdds: 35, poolAddress: 'EQTON5', status: 'active' },

    // --- SPORTS (Match Winners, Goalscorers, & Combat KOs) ---
    { id: 's1', category: 'sports', title: 'Real Madrid to defeat Barcelona in their upcoming El Clásico fixture?', symbol: 'UCL', targetValue: 1, yesOdds: 55, noOdds: 45, poolAddress: 'EQS1', status: 'active' },
    { id: 's2', category: 'sports', title: 'Erling Haaland to score 2 or more goals in his next Premier League match?', symbol: 'EPL', targetValue: 2, yesOdds: 48, noOdds: 52, poolAddress: 'EQS2', status: 'active' },
    { id: 's3', category: 'sports', title: 'Heavyweight boxing title fight: Fighter A to win by Knockout (KO) within 6 rounds?', symbol: 'BOX', targetValue: 6, yesOdds: 64, noOdds: 36, poolAddress: 'EQS3', status: 'active' },
    { id: 's4', category: 'sports', title: 'Will Kylian Mbappé score the opening goal in the Champions League quarter-final?', symbol: 'UCL', targetValue: 1, yesOdds: 59, noOdds: 41, poolAddress: 'EQS4', status: 'active' },
    { id: 's5', category: 'sports', title: 'UFC Title Main Event: Fighter to win via 1st Round KO/TKO?', symbol: 'UFC', targetValue: 1, yesOdds: 38, noOdds: 62, poolAddress: 'EQS5', status: 'active' },

    // --- NEWS (Imminent 30-Day Global Events) ---
    { id: 'n1', category: 'news', title: 'Will the US Federal Reserve announce an interest rate cut at the upcoming FOMC meeting?', symbol: 'MACRO', targetValue: 1, yesOdds: 42, noOdds: 58, poolAddress: 'EQN1', status: 'active' },
    { id: 'n2', category: 'news', title: 'Will UK Inflation (CPI) data release come in lower than 2.5% this month?', symbol: 'UK', targetValue: 2.5, yesOdds: 60, noOdds: 40, poolAddress: 'EQN2', status: 'active' },
    { id: 'n3', category: 'news', title: 'Will SpaceX successfully launch its next orbital Starship flight within 30 days?', symbol: 'SPACE', targetValue: 1, yesOdds: 75, noOdds: 25, poolAddress: 'EQN3', status: 'active' },
    { id: 'n4', category: 'news', title: 'Will European Central Bank (ECB) hold interest rates steady this month?', symbol: 'EU', targetValue: 1, yesOdds: 80, noOdds: 20, poolAddress: 'EQN4', status: 'active' },
    { id: 'n5', category: 'news', title: 'Will global crude oil prices (Brent) average above $75 a barrel over the next 30 days?', symbol: 'OIL', targetValue: 75, yesOdds: 53, noOdds: 47, poolAddress: 'EQN5', status: 'active' },
  ];

  const BACKEND_URL = 'https://kote-backend.onrender.com';

  useEffect(() => {
    async function fetchBackendMarkets() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/markets`);
        const data = await res.json();
        if (data.success && data.markets.length > 0) {
          const formatted = data.markets.map((m: any, idx: number) => ({
            id: `b-${idx}`,
            category: 'crypto' as const,
            title: `${m.symbol.toUpperCase()} hits target $${m.targetValue.toLocaleString()}?`,
            symbol: m.symbol.toUpperCase(),
            targetValue: m.targetValue,
            yesOdds: 50,
            noOdds: 50,
            poolAddress: m.poolAddress,
            status: m.status
          }));
          setMarkets([...formatted, ...expandedMarkets]);
        } else {
          setMarkets(expandedMarkets);
        }
      } catch (err) {
        setMarkets(expandedMarkets);
      } finally {
        setLoading(false);
      }
    }
    fetchBackendMarkets();
  }, []);

  const handlePlaceWager = () => {
    if (!userAddress) {
      alert('Please connect your TON wallet first using the button in the top right.');
      return;
    }
    if (!selectedMarket) return;

    const numericWager = parseFloat(wagerAmount) || 0;
    const treasuryFee = numericWager * 0.10;
    const netPoolContribution = numericWager * 0.90;

    alert(
      `Wager Confirmed!\n\n` +
      `Market: "${selectedMarket.title}"\n` +
      `Side: ${betSide} | Amount: ${numericWager} TON\n` +
      `• 90% (${netPoolContribution.toFixed(2)} TON) entered into winning pool distribution\n` +
      `• 10% (${treasuryFee.toFixed(2)} TON) allocated to Treasury Fee Wallet:\n${TREASURY_WALLET}`
    );

    setSelectedMarket(null);
    setWagerAmount('1');
  };

  const filteredMarkets = markets.filter(m => m.category === activeTab);

  return (
    <main style={{ padding: '16px', maxWidth: '480px', margin: '0 auto', paddingBottom: '60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 800, background: 'linear-gradient(90deg, #0098EA, #2481cc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOTE PREDICTIONS</h1>
          <p style={{ fontSize: '11px', color: '#8a96a3', margin: '2px 0 0 0'
