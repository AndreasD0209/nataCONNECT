// Types and mock data for the NataCONNECT demo

export type Pillar = 'shield' | 'practice' | 'guide' | 'goals' | 'account';

export type FamilyRole = 'admin' | 'member' | 'protected' | 'limited';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  pin: string;
  lastLogin: string;
  phoneLocked: boolean;
  healthScore: number;
  netWorth: number;
  avatar: string;
  color: string;
  badge: string;
  country?: string;
}

export interface FamilyGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  managedBy: string;
  contributions: Array<{ name: string; amount: number }>;
  icon: string;
  color: string;
}

export interface FamilyActivity {
  id: string;
  text: string;
  timestamp: string;
  status: 'approved' | 'blocked' | 'notified';
}

export interface Card {
  id: string;
  name: string;
  cardType: 'debit' | 'credit';
  lastFour: string;
  brand: string;
  balance: number;
  currency: string;
  color: string;
  isActive: boolean;
}

export interface ShieldRule {
  id: string;
  cardId: string;
  ruleText: string;
  ruleType: 'spending_limit' | 'time_restriction' | 'seller_verification' | 'category_block' | 'custom';
  isActive: boolean;
  parameters: Record<string, unknown>;
  scope?: 'personal' | 'family';
}

export interface Transaction {
  id: string;
  cardId: string;
  sellerName: string;
  sellerUrl?: string;
  amount: number;
  currency: string;
  category: string;
  status: 'pending' | 'approved' | 'blocked' | 'flagged';
  blockReason?: string;
  ruleId?: string;
  isScamReport: boolean;
  createdAt: string;
}

export interface ScamReport {
  id: string;
  sellerName: string;
  sellerUrl?: string;
  description: string;
  reportType: string;
  verified: boolean;
  reportCount: number;
  country?: string;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  initialCapital: number;
  currentValue: number;
  maxLoss: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  status: 'active' | 'paused' | 'stopped';
}

export interface Trade {
  id: string;
  portfolioId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  status: 'open' | 'closed' | 'rejected';
  aiReasoning?: string;
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  balance: number;
  initialBalance: number;
  skillScore: number;
  totalTrades: number;
  winningTrades: number;
  isActive: boolean;
}

export interface PracticeTrade {
  id: string;
  sessionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  status: 'open' | 'closed';
  aiFeedback?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  earnedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline?: string;
  isShieldProtected: boolean;
  icon: string;
  color: string;
}

export interface CategoryLimit {
  id: string;
  category: string;
  monthlyLimit: number;
  currentSpent: number;
  isActive: boolean;
}

// Mock data
export const mockFamilyMembers: FamilyMember[] = [
  { id: 'zack', name: 'Zack', role: 'member', pin: '', lastLogin: '2026-06-14 10:00', phoneLocked: false, healthScore: 84, netWorth: 0, avatar: 'Z', color: '#3b82f6', badge: 'Member' },
  { id: 'sarah', name: 'Sarah', role: 'member', pin: '', lastLogin: '2026-06-14 10:00', phoneLocked: false, healthScore: 79, netWorth: 0, avatar: 'S', color: '#ec4899', badge: 'Member' },
  { id: 'george', name: 'George', role: 'member', pin: '', lastLogin: '2026-06-14 10:00', phoneLocked: false, healthScore: 81, netWorth: 0, avatar: 'G', color: '#10b981', badge: 'Member' },
];

export const mockFamilyGoals: FamilyGoal[] = [];

export const mockFamilyActivity: FamilyActivity[] = []; 

export const mockShieldRules: ShieldRule[] = []; 

export const mockFamilyShieldRules: ShieldRule[] = []; 

export const mockTransactions: Transaction[] = [];

export const mockScamReports: ScamReport[] = []; 

export const mockPortfolio: Portfolio = { id: '0', name: 'Main Portfolio', initialCapital: 0, currentValue: 0, maxLoss: 0, riskProfile: 'conservative', status: 'paused' }; 

export const mockTrades: Trade[] = []; 

export const mockPracticeSession: PracticeSession = {
  id: '0',
  balance: 10000,
  initialBalance: 10000,
  skillScore: 0,
  totalTrades: 0,
  winningTrades: 0,
  isActive: true,
};

export const mockPracticeTrades: PracticeTrade[] = [];

export const mockPracticeSessions: PracticeSession[] = [mockPracticeSession];

export const mockAchievements: Achievement[] = []; 

export const mockGoals: Goal[] = []; 

export const mockCategoryLimits: CategoryLimit[] = []; 

export const mockPortfolioHistory: { time: string; value: number }[] = []; 

export const mockMarketData: { symbol: string; name: string; current: number; high: number; low: number; change: number; changePercent: number }[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', current: 175.32, high: 176.50, low: 170.10, change: 1.25, changePercent: 0.72 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', current: 335.10, high: 340.00, low: 330.00, change: -0.85, changePercent: -0.25 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', current: 132.45, high: 135.00, low: 130.00, change: 2.10, changePercent: 1.61 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', current: 244.80, high: 250.00, low: 240.00, change: -3.50, changePercent: -1.41 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', current: 420.00, high: 425.00, low: 410.00, change: 5.00, changePercent: 1.20 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', current: 135.60, high: 138.00, low: 133.00, change: 0.60, changePercent: 0.44 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', current: 298.25, high: 305.00, low: 295.00, change: -1.75, changePercent: -0.58 },
  { symbol: 'BTC', name: 'Bitcoin', current: 56000, high: 56500, low: 55000, change: 1200, changePercent: 2.19 },
]; 
