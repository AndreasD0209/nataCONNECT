import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import type { ScamReport } from '../stores/appStore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.appId);
const app = isFirebaseConfigured && !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = isFirebaseConfigured ? getFirestore(app) : null;
const reportsCollection = db ? collection(db, 'scamReports') : null;

export interface CommunityReportInput {
  hostname: string;
  sellerName: string;
  sellerUrl: string;
  reportType: 'scam' | 'suspicious';
  country: string;
  description: string;
}

function mapDocToScamReport(doc: DocumentData, id: string): ScamReport {
  return {
    id,
    sellerName: doc.sellerName || doc.hostname || 'Unknown seller',
    sellerUrl: doc.sellerUrl,
    description: doc.description || '',
    reportType: doc.reportType || 'suspicious',
    verified: !!doc.verified,
    reportCount: typeof doc.reportCount === 'number' ? doc.reportCount : 1,
    country: doc.country || undefined,
    createdAt: (doc.createdAt && typeof doc.createdAt.toDate === 'function') ? doc.createdAt.toDate().toISOString() : (typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString()),
  };
}

export async function reportScamToFirebase(report: CommunityReportInput): Promise<ScamReport | null> {
  if (!reportsCollection) return null;

  const existingQuery = query(reportsCollection, where('hostname', '==', report.hostname), limit(1));
  const snapshot = await getDocs(existingQuery);

  if (!snapshot.empty) {
    const reportDoc = snapshot.docs[0];
    const existing = reportDoc.data();
    const updatedReport = {
      ...existing,
      reportCount: (existing.reportCount || 0) + 1,
      country: report.country,
      description: report.description,
      sellerName: report.sellerName,
      sellerUrl: report.sellerUrl,
      reportType: report.reportType,
      verified: existing.verified || false,
      createdAt: existing.createdAt || new Date().toISOString(),
    };

    await updateDoc(reportDoc.ref, {
      reportCount: increment(1),
      country: report.country,
      description: report.description,
      updatedAt: serverTimestamp(),
      lastReported: serverTimestamp(),
    });

    return mapDocToScamReport(updatedReport, reportDoc.id);
  }

  const createdAt = new Date().toISOString();
  const docRef = await addDoc(reportsCollection, {
    hostname: report.hostname,
    sellerName: report.sellerName,
    sellerUrl: report.sellerUrl,
    reportType: report.reportType,
    country: report.country,
    description: report.description,
    verified: false,
    reportCount: 1,
    createdAt,
    lastReported: serverTimestamp(),
  });

  return {
    id: docRef.id,
    sellerName: report.sellerName,
    sellerUrl: report.sellerUrl,
    description: report.description,
    reportType: report.reportType,
    verified: false,
    reportCount: 1,
    country: report.country,
    createdAt,
  };
}

export function subscribeToCommunityFeed(onUpdate: (reports: ScamReport[]) => void, countryCode?: string) {
  if (!reportsCollection) return () => { };

  // Order by most recently reported first, fall back to reportCount when missing
  let feedQuery = query(reportsCollection, orderBy('lastReported', 'desc'), limit(20));
  if (countryCode) {
    feedQuery = query(reportsCollection, where('country', '==', countryCode), orderBy('lastReported', 'desc'), limit(20));
  }

  const unsubscribe = onSnapshot(feedQuery, snapshot => {
    const reports = snapshot.docs.map(doc => mapDocToScamReport(doc.data(), doc.id));
    onUpdate(reports);
  });

  return unsubscribe;
}

export async function getCommunityReport(hostname: string): Promise<ScamReport | null> {
  if (!reportsCollection) return null;
  const q = query(reportsCollection, where('hostname', '==', hostname), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapDocToScamReport(doc.data(), doc.id);
}

export async function getCommunityStats() {
  if (!reportsCollection) return null;
  const snapshot = await getDocs(query(reportsCollection, limit(100)));
  const reports = snapshot.docs.map(doc => mapDocToScamReport(doc.data(), doc.id));

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
