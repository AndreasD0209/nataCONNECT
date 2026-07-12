const savedConfig = JSON.parse(localStorage.getItem('nataMarketConfig') || '{}');
const FINNHUB_KEY = savedConfig.apiKey || import.meta.env.VITE_FINNHUB_KEY || '';
const BASE = savedConfig.endpoint || 'https://finnhub.io/api/v1';

// Helper to add timeout to fetch
const fetchWithTimeout = (url: string, timeout = 5000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), timeout)
    ),
  ]) as Promise<Response>;
};

export const marketAPI = {
  // Get real stock quote
  getQuote: async (symbol: string) => {
    try {
      const res = await fetchWithTimeout(
        `${BASE}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      console.error(`Failed to fetch quote for ${symbol}:`, e);
      return { c: 0, h: 0, l: 0, o: 0, pc: 0, dp: 0 };
    }
    // Returns: c (current), h (high), l (low), o (open), pc (prev close), dp (% change)
  },

  // Get multiple quotes at once
  getMultipleQuotes: async (symbols: string[]) => {
    try {
      const results = await Promise.all(
        symbols.map(s =>
          marketAPI.getQuote(s)
            .then(data => ({ symbol: s, ...data }))
            .catch(e => {
              console.error(`Error fetching ${s}:`, e);
              return { symbol: s, c: 0, h: 0, l: 0, o: 0, pc: 0, dp: 0 };
            })
        )
      );
      return results.filter(r => r.c > 0 || r.h > 0); // Filter out empty responses
    } catch (e) {
      console.error('Failed to fetch multiple quotes:', e);
      return [];
    }
  },

  // Get crypto price
  getCrypto: async (symbol: string) => {
    try {
      const res = await fetchWithTimeout(
        `${BASE}/quote?symbol=BINANCE:${symbol}USDT&token=${FINNHUB_KEY}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      console.error(`Failed to fetch crypto ${symbol}:`, e);
      return { c: 0, h: 0, l: 0, o: 0, pc: 0, dp: 0 };
    }
  },

  // Get market news
  getNews: async () => {
    try {
      const res = await fetchWithTimeout(
        `${BASE}/news?category=general&token=${FINNHUB_KEY}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      console.error('Failed to fetch news:', e);
      return [];
    }
  },

  // Get company profile
  getProfile: async (symbol: string) => {
    try {
      const res = await fetchWithTimeout(
        `${BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (e) {
      console.error(`Failed to fetch profile for ${symbol}:`, e);
      return { name: symbol };
    }
  }
};
