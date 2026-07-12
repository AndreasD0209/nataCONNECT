import { PI_URL } from './pi';

function getBankConfig() {
  return JSON.parse(localStorage.getItem('nataBankConfig') || '{}');
}

export const bankAPI = {
  listBanks: (country = 'CY') => {
    const config = getBankConfig();
    return fetch(`${PI_URL}/bank/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, country }),
    }).then(r => r.json());
  },

  connectBank: (bankId: string, memberId: string) => {
    const config = getBankConfig();
    return fetch(`${PI_URL}/bank/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, bankId, memberId }),
    }).then(r => r.json());
  },

  syncTransactions: (memberId: string) => {
    const config = getBankConfig();
    return fetch(`${PI_URL}/bank/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, memberId }),
    }).then(r => r.json());
  },

  getStatus: (memberId: string) =>
    fetch(`${PI_URL}/bank/status/${memberId}`).then(r => r.json()),
};
