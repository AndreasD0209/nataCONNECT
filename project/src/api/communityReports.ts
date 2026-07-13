import type { ScamReport } from '../stores/appStore';

const STORAGE_KEY = 'nataconnect_community_reports';
const SUBSCRIBERS = new Set<(reports: ScamReport[]) => void>();

export interface CommunityReportInput {
  hostname: string;
  sellerName: string;
  sellerUrl: string;
  reportType: 'scam' | 'suspicious';
  country: string;
  description: string;
}

type CommunityReportRecord = ScamReport & {
  hostname: string;
  updatedAt?: string;
  lastReported?: string;
};

const SEED_REPORTS: CommunityReportRecord[] = [
  {
    id: 'superdealz-shop.xyz',
    hostname: 'superdealz-shop.xyz',
    sellerName: 'SuperDealz Shop',
    sellerUrl: 'https://superdealz-shop.xyz',
    description: 'Fake online store',
    reportType: 'scam',
    verified: false,
    reportCount: 89,
    country: 'GB',
    createdAt: '2026-06-09T00:00:00.000Z',
  },
  {
    id: 'luckywin-casino.net',
    hostname: 'luckywin-casino.net',
    sellerName: 'LuckyWin Casino',
    sellerUrl: 'https://luckywin-casino.net',
    description: 'Gambling scam',
    reportType: 'scam',
    verified: false,
    reportCount: 134,
    country: 'GB',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'fakeapple-store.com',
    hostname: 'fakeapple-store.com',
    sellerName: 'Fake Apple Store',
    sellerUrl: 'https://fakeapple-store.com',
    description: 'Phishing',
    reportType: 'suspicious',
    verified: false,
    reportCount: 128,
    country: 'DE',
    createdAt: '2026-06-08T00:00:00.000Z',
  },
];

function safeJsonParse(raw: string | null): CommunityReportRecord[] | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as CommunityReportRecord[] : null;
  } catch {
    return null;
  }
}

function normalizeHostname(input: string) {
  return input.replace(/^www\./, '').toLowerCase();
}

function mapRecordToReport(record: CommunityReportRecord): ScamReport {
  return {
    id: record.id,
    sellerName: record.sellerName,
    sellerUrl: record.sellerUrl,
    description: record.description,
    reportType: record.reportType,
    verified: record.verified,
    reportCount: record.reportCount,
    country: record.country,
    createdAt: record.createdAt,
  };
}

function readStore(): CommunityReportRecord[] {
  if (typeof window === 'undefined') {
    return [...SEED_REPORTS];
  }

  const stored = safeJsonParse(window.localStorage.getItem(STORAGE_KEY));
  return stored && stored.length > 0 ? stored : [...SEED_REPORTS];
}

function writeStore(reports: CommunityReportRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function emit() {
  const reports = readStore().map(mapRecordToReport);
  SUBSCRIBERS.forEach(subscriber => subscriber(reports));
}

export async function reportScamToCommunityStore(report: CommunityReportInput): Promise<ScamReport | null> {
  const reports = readStore();
  const hostname = normalizeHostname(report.hostname);
  const now = new Date().toISOString();
  const existingIndex = reports.findIndex(item => normalizeHostname(item.hostname) === hostname);

  if (existingIndex >= 0) {
    const existing = reports[existingIndex];
    const updated: CommunityReportRecord = {
      ...existing,
      hostname,
      sellerName: report.sellerName,
      sellerUrl: report.sellerUrl,
      description: report.description,
      reportType: report.reportType,
      country: report.country,
      reportCount: existing.reportCount + 1,
      verified: existing.verified || false,
      updatedAt: now,
      lastReported: now,
    };

    reports[existingIndex] = updated;
    writeStore(reports);
    emit();
    return mapRecordToReport(updated);
  }

  const created: CommunityReportRecord = {
    id: hostname,
    hostname,
    sellerName: report.sellerName,
    sellerUrl: report.sellerUrl,
    description: report.description,
    reportType: report.reportType,
    verified: false,
    reportCount: 1,
    country: report.country,
    createdAt: now,
    lastReported: now,
  };

  reports.unshift(created);
  writeStore(reports);
  emit();
  return mapRecordToReport(created);
}

export function subscribeToCommunityFeed(onUpdate: (reports: ScamReport[]) => void, countryCode?: string) {
  const handler = (reports: ScamReport[]) => {
    const filtered = countryCode
      ? reports.filter(report => (report.country || '').toUpperCase() === countryCode.toUpperCase())
      : reports;
    onUpdate(filtered.sort((a, b) => b.reportCount - a.reportCount));
  };

  SUBSCRIBERS.add(handler);
  handler(readStore().map(mapRecordToReport));

  return () => {
    SUBSCRIBERS.delete(handler);
  };
}

export async function getCommunityReport(hostname: string): Promise<ScamReport | null> {
  const normalized = normalizeHostname(hostname);
  const report = readStore().find(item => normalizeHostname(item.hostname) === normalized);
  return report ? mapRecordToReport(report) : null;
}

export async function getCommunityStats() {
  const reports = readStore().map(mapRecordToReport);
  const totalReports = reports.reduce((sum, item) => sum + item.reportCount, 0);
  const uniqueSellers = reports.length;
  const countries = reports.reduce<Record<string, number>>((acc, item) => {
    if (!item.country) return acc;
    const key = item.country.toUpperCase();
    acc[key] = (acc[key] || 0) + item.reportCount;
    return acc;
  }, {});
  const topCountry = Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalReports,
    uniqueSellers,
    topCountry,
  };
}