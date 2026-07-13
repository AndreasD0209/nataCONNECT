import { Shield, Target, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import type { FamilyMember, FamilyGoal, FamilyActivity } from '../../stores/appStore';

interface FamilyOverviewProps {
  members: FamilyMember[];
  familyGoals: FamilyGoal[];
  activities: FamilyActivity[];
  onClose: () => void;
}

export function FamilyOverview({ members, familyGoals, activities, onClose }: FamilyOverviewProps) {
  const combinedNetWorth = members.reduce((sum, member) => sum + member.netWorth, 0);
  const lockedCount = members.filter(m => m.phoneLocked).length;
  const activeThreats = activities.filter(a => a.status === 'notified').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Family Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Admin dashboard for the whole family vault.</p>
        </div>
        <button onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/95 transition-all">
          <ArrowRight size={14} /> Back to Account
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5" gradient>
          <div className="text-xs text-slate-300 uppercase tracking-[0.2em] mb-3">Combined Net Worth</div>
          <div className="text-3xl font-semibold text-white">€{combinedNetWorth.toLocaleString('en-GB')}</div>
          <div className="text-sm text-slate-400 mt-2">Across all family members</div>
        </GlassCard>
        <GlassCard className="p-5" gradient>
          <div className="text-xs text-slate-300 uppercase tracking-[0.2em] mb-3">Active Threats</div>
          <div className="text-3xl font-semibold text-white">{activeThreats}</div>
          <div className="text-sm text-slate-400 mt-2">Flagged or reviewed transactions</div>
        </GlassCard>
        <GlassCard className="p-5" gradient>
          <div className="text-xs text-slate-300 uppercase tracking-[0.2em] mb-3">Phones Locked</div>
          <div className="text-3xl font-semibold text-white">{lockedCount}</div>
          <div className="text-sm text-slate-400 mt-2">Current member devices locked</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard className="p-5" gradient>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Family Members</h2>
              <p className="text-sm text-slate-400">Health scores and current net worth.</p>
            </div>
            <div className="text-sm text-slate-500">{members.length} members</div>
          </div>
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/90 text-white font-semibold">{member.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{member.name}</div>
                    <div className="text-xs text-slate-400">{member.badge}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{member.healthScore}%</div>
                  <div className="text-xs text-slate-400">€{member.netWorth.toLocaleString('en-GB')}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5" gradient>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Family Shared Goals</h2>
              <p className="text-sm text-slate-400">Progress for each shared objective.</p>
            </div>
            <Badge variant="info">Shared</Badge>
          </div>
          <div className="space-y-3">
            {familyGoals.map(goal => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{goal.name}</div>
                      <div className="text-xs text-slate-400">Managed by {goal.managedBy}</div>
                    </div>
                    <div className="text-sm font-semibold text-white">{Math.round(progress)}%</div>
                  </div>
                  <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden mt-3">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    €{goal.currentAmount.toLocaleString('en-GB')} / €{goal.targetAmount.toLocaleString('en-GB')}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5" gradient>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <p className="text-sm text-slate-400">All family account events in one view.</p>
          </div>
          <Badge variant="warning">Live</Badge>
        </div>
        <div className="space-y-3">
          {activities.map(activity => (
            <div key={activity.id} className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4 flex items-start gap-4">
              <div className="mt-1 text-slate-300">{activity.status === 'approved' ? 'Done' : activity.status === 'blocked' ? 'Blocked' : 'Info'}</div>
              <div className="flex-1">
                <div className="text-sm text-white">{activity.text}</div>
                <div className="text-xs text-slate-500 mt-1">{activity.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
