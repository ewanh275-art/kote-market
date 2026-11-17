'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetchMarkets();
    // Optional: auto-refresh every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff', background: '#121212', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>KOTE Prediction Markets</h1>
        <button 
          onClick={fetchMarkets} 
          style={{ background: '#2481cc', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </header>

      <section>
        <h2 style={{ fontSize: '16px', color: '#aaa', marginBottom: '12px' }}>Live Oracle Queue</h2>
        
        {loading && <p>Loading active markets...</p>}
        {error && <p style={{ color: '#e74c3c' }}>{error}</p>}

        {!loading && !error && markets.length === 0 && (
          <p style={{ color: '#888' }}>No active markets currently registered in the oracle engine.</p>
        )}

        {!loading && !error && markets.map((market, index) => (
          <div key={index} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 6px 0', textTransform: 'uppercase' }}>{market.symbol} / USD</h3>
            <p style={{ margin: '4px 0', color: '#ccc' }}><strong>Target Price:</strong> ${market.targetValue.toLocaleString()}</p>
            <p style={{ margin: '4px 0', color: '#777', fontSize: '13px' }}><strong>Pool:</strong> {market.poolAddress}</p>
            <span style={{ 
              display: 'inline-block', 
              marginTop: '8px', 
              padding: '4px 8px', 
              borderRadius: '6px', 
              fontSize: '12px', 
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
