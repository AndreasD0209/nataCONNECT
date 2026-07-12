require('dotenv').config();
const FINNHUB_KEY = process.env.FINNHUB_KEY;
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('nataconnect.db');
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    pin TEXT,
    color TEXT,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    type TEXT,
    last_four TEXT,
    balance REAL,
    label TEXT,
    locked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    card_id TEXT,
    merchant TEXT,
    amount REAL,
    category TEXT,
    status TEXT,
    timestamp TEXT,
    blocked_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    name TEXT,
    target REAL,
    current REAL,
    deadline TEXT,
    protected INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS shield_rules (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    rule TEXT,
    active INTEGER DEFAULT 1,
    scope TEXT DEFAULT 'personal'
  );

  CREATE TABLE IF NOT EXISTS phone_devices (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    device_name TEXT,
    locked INTEGER DEFAULT 0,
    last_location TEXT
  );

  CREATE TABLE IF NOT EXISTS bank_connections (
    member_id TEXT PRIMARY KEY,
    bank_id TEXT,
    requisition_id TEXT,
    link TEXT
  );

  CREATE TABLE IF NOT EXISTS scam_domains (
    domain TEXT PRIMARY KEY,
    reports INTEGER DEFAULT 0,
    category TEXT,
    first_seen TEXT,
    last_seen TEXT,
    verified INTEGER DEFAULT 0
  );
`);

// Seed default family if empty
const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
if (memberCount.count === 0) {
  const insert = db.prepare('INSERT INTO members VALUES (?, ?, ?, ?, ?, ?)');
  insert.run('1', 'Zack', 'admin', '1234', '#3b82f6', new Date().toISOString());
  insert.run('2', 'Sarah', 'member', '5678', '#ec4899', new Date().toISOString());
  insert.run('3', 'Giorgos', 'protected', '0000', '#10b981', new Date().toISOString());
}

// Seed scam domains
const scamSeed = db.prepare('SELECT COUNT(*) as count FROM scam_domains').get();
if (scamSeed.count === 0) {
  db.prepare(`
    INSERT INTO scam_domains (domain, reports, category, first_seen, last_seen, verified)
    VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)
  `).run(
    'superdealz-shop.xyz', 89, 'Fake online store', '2026-06-09', '2026-06-13', 0,
    'luckywin-casino.net', 134, 'Gambling scam', '2026-06-01', '2026-06-13', 0,
    'fakeapple-store.com', 128, 'Phishing', '2026-06-08', '2026-06-13', 0,
    'cheapiphone-deals.xyz', 67, 'Fake store', '2026-06-05', '2026-06-13', 0,
    'crypto-doubler.io', 203, 'Crypto scam', '2026-05-20', '2026-06-13', 0,
    'nataconnect-fake.com', 12, 'Brand impersonation', '2026-06-12', '2026-06-13', 0
  );
}

// Members
app.get('/family/members', (req, res) => {
  const members = db.prepare('SELECT * FROM members').all();
  res.json(members);
});

app.post('/family/members', (req, res) => {
  const { id, name, role, pin, color } = req.body;
  db.prepare('INSERT INTO members VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, role, pin, color, new Date().toISOString());
  res.json({ success: true });
});

app.post('/family/verify-pin', (req, res) => {
  const { memberId, pin } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE id = ? AND pin = ?').get(memberId, pin);

  if (member) {
    db.prepare('UPDATE members SET last_login = ? WHERE id = ?').run(new Date().toISOString(), memberId);
    res.json({ success: true, member });
  } else {
    res.json({ success: false });
  }
});

app.get('/cards/:memberId', (req, res) => {
  const cards = db.prepare('SELECT * FROM cards WHERE member_id = ?').all(req.params.memberId);
  res.json(cards);
});

app.get('/transactions/:cardId', (req, res) => {
  const transactions = db.prepare('SELECT * FROM transactions WHERE card_id = ? ORDER BY timestamp DESC').all(req.params.cardId);
  res.json(transactions);
});

app.get('/goals/:memberId', (req, res) => {
  const goals = db.prepare('SELECT * FROM goals WHERE member_id = ?').all(req.params.memberId);
  res.json(goals);
});

app.get('/shield/:memberId', (req, res) => {
  const rules = db.prepare('SELECT * FROM shield_rules WHERE member_id = ? OR scope = ?').all(req.params.memberId, 'family');
  res.json(rules);
});

app.post('/emergency/lock-phone', (req, res) => {
  const { deviceId, passcode, memberId } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);

  if (member && member.pin === passcode) {
    db.prepare('UPDATE phone_devices SET locked = 1 WHERE id = ?').run(deviceId);
    res.json({ success: true, message: 'Phone locked. Cards untouchable.' });
  } else {
    res.json({ success: false, message: 'Wrong passcode.' });
  }
});

app.post('/emergency/unlock-phone', (req, res) => {
  const { deviceId, passcode, memberId } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);

  if (member && member.pin === passcode) {
    db.prepare('UPDATE phone_devices SET locked = 0 WHERE id = ?').run(deviceId);
    res.json({ success: true, message: 'Phone restored.' });
  } else {
    res.json({ success: false, message: 'Wrong passcode.' });
  }
});

app.get('/pi/status', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: 'Your Pi is running. Data is safe.'
  });
});

app.post('/ai/chat', async (req, res) => {
  const { messages, systemPrompt, model, apiKey, endpoint } = req.body;

  try {
    const response = await axios.post(
      endpoint || 'https://api.anthropic.com/v1/messages',
      {
        model: model || 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    res.json({ success: true, content: response.data.content[0].text });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/market/quote/:symbol', async (req, res) => {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${req.params.symbol}&token=${FINNHUB_KEY}`
    );
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.post('/market/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const r = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
        );
        return { symbol, ...r.data };
      })
    );
    res.json(results);
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('/market/crypto/:symbol', async (req, res) => {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=BINANCE:${req.params.symbol}USDT&token=${FINNHUB_KEY}`
    );
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

async function getGoCardlessToken(secretId, secretKey, endpoint) {
  const res = await axios.post(
    `${endpoint}/token/new/`,
    { secret_id: secretId, secret_key: secretKey }
  );
  return res.data.access;
}

app.post('/bank/list', async (req, res) => {
  const { secretId, secretKey, endpoint, country } = req.body;

  try {
    const token = await getGoCardlessToken(secretId, secretKey, endpoint);
    const response = await axios.get(
      `${endpoint}/institutions/?country=${country || 'CY'}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.post('/bank/connect', async (req, res) => {
  const { secretId, secretKey, endpoint, bankId, memberId } = req.body;

  try {
    const token = await getGoCardlessToken(secretId, secretKey, endpoint);

    const agreement = await axios.post(
      `${endpoint}/agreements/enduser/`,
      {
        institution_id: bankId,
        max_historical_days: 90,
        access_valid_for_days: 30,
        access_scope: ['balances', 'details', 'transactions']
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const requisition = await axios.post(
      `${endpoint}/requisitions/`,
      {
        redirect: `http://localhost:5173/bank-connected`,
        institution_id: bankId,
        agreement: agreement.data.id,
        reference: `member-${memberId}`,
        user_language: 'EN'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    db.prepare('INSERT OR REPLACE INTO bank_connections VALUES (?, ?, ?, ?)')
      .run(memberId, bankId, requisition.data.id, requisition.data.link);

    res.json({ link: requisition.data.link });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.post('/bank/sync', async (req, res) => {
  const { secretId, secretKey, endpoint, memberId } = req.body;

  try {
    const token = await getGoCardlessToken(secretId, secretKey, endpoint);
    const connection = db.prepare('SELECT * FROM bank_connections WHERE member_id = ?').get(memberId);

    if (!connection) {
      return res.json({ error: 'No bank connected' });
    }

    const requisition = await axios.get(
      `${endpoint}/requisitions/${connection.requisition_id}/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const accountId = requisition.data.accounts[0];

    const balances = await axios.get(
      `${endpoint}/accounts/${accountId}/balances/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const transactions = await axios.get(
      `${endpoint}/accounts/${accountId}/transactions/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const booked = transactions.data.transactions.booked;
    booked.forEach((t) => {
      db.prepare(`
        INSERT OR REPLACE INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        t.transactionId,
        memberId,
        t.creditorName || t.debtorName || 'Unknown',
        parseFloat(t.transactionAmount.amount),
        t.proprietaryBankTransactionCode || 'general',
        'approved',
        t.bookingDate,
        null
      );
    });

    const balance = balances.data.balances[0].balanceAmount.amount;
    db.prepare('UPDATE cards SET balance = ? WHERE member_id = ?').run(balance, memberId);

    res.json({
      success: true,
      transactionCount: booked.length,
      balance,
      message: `Synced ${booked.length} transactions. Stored locally on your Pi.`
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('/bank/status/:memberId', (req, res) => {
  const connection = db.prepare('SELECT * FROM bank_connections WHERE member_id = ?').get(req.params.memberId);
  res.json({ connected: !!connection, connection });
});

app.post('/shield/check-domain', async (req, res) => {
  const { url } = req.body;

  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    const scamEntry = db.prepare('SELECT * FROM scam_domains WHERE domain = ?').get(domain);

    const isSuspiciousPattern =
      domain.endsWith('.xyz') ||
      (domain.endsWith('.io') && scamEntry) ||
      domain.includes('-shop') ||
      domain.includes('free') ||
      domain.includes('win') ||
      domain.includes('crypto');

    if (scamEntry && scamEntry.reports > 10) {
      res.json({
        safe: false,
        status: 'danger',
        domain,
        reports: scamEntry.reports,
        category: scamEntry.category,
        firstSeen: scamEntry.first_seen,
        message: 'SCAM DETECTED'
      });
    } else if (isSuspiciousPattern || (scamEntry && scamEntry.reports <= 10)) {
      res.json({
        safe: false,
        status: 'suspicious',
        domain,
        reports: scamEntry?.reports || 0,
        category: 'Unverified',
        message: 'PROCEED WITH CAUTION'
      });
    } else {
      res.json({
        safe: true,
        status: 'safe',
        domain,
        reports: 0,
        message: 'LOOKS SAFE'
      });
    }
  } catch (e) {
    res.json({
      safe: false,
      status: 'suspicious',
      message: 'Invalid URL'
    });
  }
});

app.post('/shield/report-domain', (req, res) => {
  const { domain, category } = req.body;
  const existing = db.prepare('SELECT * FROM scam_domains WHERE domain = ?').get(domain);

  if (existing) {
    db.prepare('UPDATE scam_domains SET reports = reports + 1, last_seen = ? WHERE domain = ?')
      .run(new Date().toISOString(), domain);
  } else {
    db.prepare('INSERT INTO scam_domains VALUES (?, 1, ?, ?, ?, 0)')
      .run(domain, category || 'Reported by user', new Date().toISOString(), new Date().toISOString());
  }

  res.json({ success: true, message: 'Reported to community. Thank you for keeping everyone safe.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`NataConnect Pi Server running on port ${port}`);
});
