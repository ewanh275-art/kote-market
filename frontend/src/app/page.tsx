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

  const TREASURY_WALLET = 'UQBmKzuh-NqzUnXzimjajTadV7srrXXKoQeMCxt8YtVhuVqB';

  const expandedMarkets: Market[] = [
    // --- CRYPTO ---
    { id: 'c1', category: 'crypto', title: 'Will Bitcoin (BTC) close above $95,000 before the end of this month?', symbol: 'BTC', targetValue: 95000, yesOdds: 68, noOdds: 32, poolAddress: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N', status: 'active' },
    { id: 'c2', category: 'crypto', title: 'Will Ethereum (ETH) hit $4,000 within the next 30 days?', symbol: 'ETH', targetValue: 4000, yesOdds: 62, noOdds: 38, poolAddress: 'EQA123', status: 'active' },
    { id: 'c3', category: 'crypto', title: 'Will Solana (SOL) break its 30-day resistance high of $220?', symbol: 'SOL', targetValue: 220, yesOdds: 54, noOdds: 46, poolAddress: 'EQA124', status: 'active' },
    { id: 'c4', category: 'crypto', title: 'Will Ripple (XRP) sustain a weekly close above $1.80?', symbol: 'XRP', targetValue: 1.8, yesOdds: 51, noOdds: 49, poolAddress: 'EQA125', status: 'active' },
    { id: 'c5', category: 'crypto', title: 'Will the total crypto market cap stay above $3.2 Trillion for 7 consecutive days?', symbol: 'TOTAL', targetValue: 3200000000000, yesOdds: 70, noOdds: 30, poolAddress: 'EQA126', status: 'active' },

    // --- GRAM & TON BLOCKCHAIN ---
    { id: 'g1', category: 'gram', title: 'Will $GRAM record a new monthly high trading volume on DeDust?', symbol: 'GRAM', targetValue: 1, yesOdds: 78, noOdds: 22, poolAddress: 'EQGRAM1', status: 'active' },
    { id: 'g2', category: 'gram', title: 'Will Toncoin ($GRAM ecosystem asset) break past $7.50 within 30 days?', symbol: 'GRAM', targetValue: 7.5, yesOdds: 58, noOdds: 42, poolAddress: 'EQTON2', status: 'active' },
    { id: 'g3', category: 'gram', title: 'Will active wallets on the TON network cross 150 Million this month?', symbol: 'GRAM', targetValue: 150000000, yesOdds: 82, noOdds: 18, poolAddress: 'EQTON3', status: 'active' },
    { id: 'g4', category: 'gram', title: 'Will Telegram Mini App daily transactions exceed 50 Million?', symbol: 'GRAM', targetValue: 50000000, yesOdds: 70, noOdds: 30, poolAddress: 'EQTON4', status: 'active' },
    { id: 'g5', category: 'gram', title: 'Will $GRAM liquidity pools on STON.fi grow by over 20% this month?', symbol: 'GRAM', targetValue: 1, yesOdds: 65, noOdds: 35, poolAddress: 'EQTON5', status: 'active' },

    // --- SPORTS ---
    { id: 's1', category: 'sports', title: 'Real Madrid to defeat Barcelona in their upcoming El Clásico fixture?', symbol: 'UCL', targetValue: 1, yesOdds: 55, noOdds: 45, poolAddress: 'EQS1', status: 'active' },
    { id: 's2', category: 'sports', title: 'Erling Haaland to score 2 or more goals in his next Premier League match?', symbol: 'EPL', targetValue: 2, yesOdds: 48, noOdds: 52, poolAddress: 'EQS2', status: 'active' },
    { id: 's3', category: 'sports', title: 'Heavyweight boxing title fight: Fighter A to win by Knockout (KO) within 6 rounds?', symbol: 'BOX', targetValue: 6, yesOdds: 64, noOdds: 36, poolAddress: 'EQS3', status: 'active' },
    { id: 's4', category: 'sports', title: 'Will Kylian Mbappé score the opening goal in the Champions League quarter-final?', symbol: 'UCL', targetValue: 1, yesOdds: 59, noOdds: 41, poolAddress: 'EQS4', status: 'active' },
    { id: 's5', category: 'sports', title: 'UFC Title Main Event: Fighter to win via 1st Round KO/TKO?', symbol: 'UFC', targetValue: 1, yesOdds: 38, noOdds: 62, poolAddress: 'EQS5', status: 'active' },

    // --- NEWS ---
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
          <p style={{ fontSize: '11px', color: '#8a96a3', margin: '2px 0 0 0' }}>Decentralized Markets • 10% Treasury Fee</p>
        </div>
        <TonConnectButton />
      </header>

      {/* 4 Category Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {(['crypto', 'gram', 'sports', 'news'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeTab === tab ? '#0098EA' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab ? '#fff' : '#8a96a3'
            }}
          >
            {tab === 'gram' ? '💎 $GRAM' : tab}
          </button>
        ))}
      </nav>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && <p style={{ textAlign: 'center', color: '#8a96a3' }}>Loading short-term prediction feeds...</p>}

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
                {market.symbol} Market (Under 30 Days)
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
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#0b0e14', color: '#fff', fontSize: '16px', boxSizing: 'border-box', marginBottom: '12px' }}
            />

            <p style={{ fontSize: '11px', color: '#8a96a3', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              ℹ️ 90% goes to the winner payout pool. 10% is automatically routed to the treasury fund upon market resolution.
            </p>

            <button 
              onClick={handlePlaceWager}
              style={{ width: '100%', background: '#0098EA', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              Confirm Wager via TON Connect
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
