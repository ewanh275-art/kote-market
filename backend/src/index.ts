import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { Bot, InlineKeyboard } from 'grammy';
import { activeMarkets, startRealtimeOracle } from './oracles/realtimeEngine';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// API endpoint for Mini App to fetch markets
app.get('/api/markets', (req, res) => {
  res.json(activeMarkets);
});

// Admin / News Webhook endpoint to settle breaking News & Politics in real time
app.post('/api/admin/resolve', async (req, res) => {
  const { marketId, outcome, secret } = req.body;
  if (secret !== process.env.BOT_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  const market = activeMarkets.find((m) => m.id === marketId);
  if (!market) return res.status(404).json({ error: 'Market not found' });

  market.status = 'RESOLVED';
  market.outcome = outcome;
  io.emit('market_update', market);
  res.json({ success: true, market });
});

// Telegram Bot Setup
if (process.env.BOT_TOKEN) {
  const bot = new Bot(process.env.BOT_TOKEN);

  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp(
      'Open KOTE MARKET',
      process.env.WEBAPP_URL || 'https://kote-market-frontend.onrender.com'
    );

    await ctx.reply(
      'Welcome to **KOTE MARKET** — Real-Time $GRAM Prediction Markets.\n\nBet live on Crypto, Football, Global News & Politics with instant on-chain payouts.',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.start();
}

startRealtimeOracle(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`KOTE MARKET Backend running on port ${PORT}`);
});
