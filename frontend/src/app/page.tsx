'use client';

import { useState, useEffect } from 'react';

interface Market {
  poolAddress: string;
  type: string;
  symbol: string;
  targetValue: number;
  status: 'active' | 'settled';
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating a new market
  const [poolAddress, setPoolAddress] = useState('');
  const [symbol, setSymbol] = useState('bitcoin');
  const [targetValue, setTargetValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Replace with your actual Render backend URL
  const BACKEND_URL = 'https://kote-backend.onrender.com';

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/markets`);
      const data = await res.json();
      if (data.success) {
        setMarkets(data.markets);
      } else {
        setError('Failed to load market data.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Could not connect to the KOTE oracle backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolAddress || !symbol || !targetValue) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress,
          type: 'crypto',
          symbol: symbol.toLowerCase(),
          targetValue: Number(targetValue),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Market registered successfully!');
        setPoolAddress('');
        setTargetValue('');
        fetchMarkets(); // Refresh list
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      console.error('Creation error:', err);
      alert('Failed to register market with backend.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#121212', minHeight: '100vh', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>KOTE Prediction Markets</h1>
        <button 
          onClick={fetchMarkets} 
          style={{ background: '#2481cc', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
        >
          Refresh
        </button>
      </header>

      {/* Create Market Form Section */}
      <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', color: '#aaa', marginTop: 0, marginBottom: '12px' }}>Register New Oracle Market</h2>
        <form onSubmit={handleCreateMarket} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Pool Contract Address</label>
            <input 
              type="text" 
              placeholder="EQ..." 
              value={poolAddress} 
              onChange={(e) => setPoolAddress(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Asset ID (CoinGecko)</label>
              <select 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxSizing: 'border-box' }}
              >
                <option value="bitcoin">Bitcoin (bitcoin)</option>
                <option value="ethereum">Ethereum (ethereum)</option>
                <option value="toncoin">Toncoin (the-open-network)</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Target Price (USD)</label>
              <input 
                type="number" 
                placeholder="70000" 
                value={targetValue} 
                onChange={(e) => setTargetValue(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}
          >
            {submitting ? 'Registering...' : 'Deploy to Oracle Queue'}
          </button>
        </form>
      </section>

      {/* Live Markets List Section */}
      <section>
        <h2 style={{ fontSize: '15px', color: '#aaa', marginBottom: '12px' }}>Live Oracle Queue</h2>
        
        {loading && <p style={{ color: '#888' }}>Loading active markets...</p>}
        {error && <p style={{ color: '#e74c3c' }}>{error}</p>}

        {!loading && !error && markets.length === 0 && (
          <p style={{ color: '#666', fontSize: '14px' }}>No active markets currently registered in the oracle engine.</p>
        )}

        {!loading && !error && markets.map((market, index) => (
          <div key={index} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 6px 0', textTransform: 'uppercase', fontSize: '16px' }}>{market.symbol} / USD</h3>
            <p style={{ margin: '4px 0', color: '#ccc', fontSize: '14px' }}><strong>Target Price:</strong> ${market.targetValue.toLocaleString()}</p>
            <p style={{ margin: '4px 0', color: '#777', fontSize: '12px', wordBreak: 'break-all' }}><strong>Pool:</strong> {market.poolAddress}</p>
            <span style={{ 
              display: 'inline-block', 
              marginTop: '8px', 
              padding: '4px 8px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontWeight: 'bold',
              background: market.status === 'active' ? '#d4ac0d' : '#27ae60',
              color: '#000'
            }}>
              {market.status.toUpperCase()}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
