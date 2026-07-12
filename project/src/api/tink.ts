import { PI_URL } from './pi';

export const tinkAPI = {
  connectBank: (memberId: string) =>
    fetch(`${PI_URL}/tink/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    }).then(r => r.json()),

  syncTransactions: (memberId: string, code: string) =>
    fetch(`${PI_URL}/tink/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, code }),
    }).then(r => r.json()),

  getStatus: (memberId: string) =>
    fetch(`${PI_URL}/tink/status/${memberId}`).then(r => r.json()),
};
