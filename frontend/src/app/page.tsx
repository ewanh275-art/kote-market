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

  const handleConnectWallet = () => {
    setWalletConnected(true);
    alert('TON Wallet connected successfully!');
  };

  const handlePlaceWager = () => {
    if (!walletConnected) {
      alert('Please connect your TON wallet first!');
      return;
    }
    if (!selectedMarket) return;

    alert(`Successfully placed wager of ${wagerAmount} TON on [${betSide}] for market: "${selectedMarket.title}"!`);
    setSelectedMarket(null);
    setWagerAmount('1');
  };

  const filteredMarkets = markets.filter(m => m.category === activeTab);

  return (
    <main style={{ padding: '16px', maxWidth: '480px', margin: '0 auto', paddingBottom: '60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 800, background: 'linear-gradient(90deg, #0098EA, #2481cc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KOTE PREDICTIONS</h1>
          <p style={{ fontSize: '11px', color: '#8a96a3', margin: '2px 0 0 0' }}>Decentralized Oracle Markets</p>
        </div>
        <button 
          onClick={handleConnectWallet}
          style={{ background: walletConnected ? '#27ae60' : '#0098EA', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
        >
          {walletConnected ? 'Connected ✓' : 'Connect Wallet'}
        </button>
      </header>

      <nav style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['crypto', 'sports', 'news'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'capitalize',
              cursor: 'pointer',
              background: activeTab === tab ? '#0098EA' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab ? '#fff' : '#8a96a3'
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && <p style={{ textAlign: 'center', color: '#8a96a3' }}>Loading prediction feeds...</p>}

        {!loading && filteredMarkets.map(market => (
          <div 
            key={market.id}
            style={{
              background: 'linear-gradient(145deg, #131823, #0d111a)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,152,234,0.15)', color: '#0098EA', textTransform: 'uppercase' }}>
                {market.symbol} Oracle
              </span>
              <span style={{ fontSize: '11px', color: '#27ae60', fontWeight: 600 }}>🟢 Live</span>
            </div>

            <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', lineHeight: '1.4', fontWeight: 600 }}>
              {market.title}
            </h3>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '6px', width: '100%', overflow: 'hidden', display: 'flex', marginBottom: '12px' }}>
              <div style={{ width: `${market.yesOdds}%`, background: '#27ae60', height: '100%' }} />
              <div style={{ width: `${market.noOdds}%`, background: '#e74c3c', height: '100%' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => { setSelectedMarket(market); setBetSide('YES'); }}
                style={{ flex: 1, background: 'rgba(39, 174, 96, 0.15)', border: '1px solid rgba(39, 174, 96, 0.3)', color: '#27ae60', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Yes</span>
                <span>{market.yesOdds}%</span>
              </button>

              <button 
                onClick={() => { setSelectedMarket(market); setBetSide('NO'); }}
                style={{ flex: 1, background: 'rgba(231, 76, 60, 0.15)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#e74c3c', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>No</span>
                <span>{market.noOdds}%</span>
              </button>
            </div>
          </div>
        ))}
      </section>

      {selectedMarket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
          <div style={{ background: '#131823', width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>Place Wager ({betSide})</h3>
              <button onClick={() => setSelectedMarket(null)} style={{ background: 'none', border: 'none', color: '#8a96a3', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: '#8a96a3', margin: '0 0 16px 0' }}>{selectedMarket.title}</p>

            <label style={{ fontSize: '12px', color: '#8a96a3', display: 'block', marginBottom: '6px' }}>Wager Amount (TON)</label>
            <input 
              type="number" 
              value={wagerAmount} 
              onChange={e => setWagerAmount(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#0b0e14', color: '#fff', fontSize: '16px', boxSizing: 'border-box', marginBottom: '16px' }}
            />

            <button 
              onClick={handlePlaceWager}
              style={{ width: '100%', background: '#0098EA', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Confirm Wager
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
