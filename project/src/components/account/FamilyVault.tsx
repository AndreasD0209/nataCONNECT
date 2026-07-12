import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Crown, Shield, User, UserPlus, Lock, Sparkles } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import type { FamilyMember, FamilyRole } from '../../stores/appStore';

interface FamilyVaultProps {
  members: FamilyMember[];
  selectedLockedMemberId?: string | null;
  onEnterMember: (memberId: string) => void;
  onUnlockMember: (memberId: string, pin: string) => Promise<boolean>;
  onAddMember: (member: FamilyMember) => void;
}

const roleMeta: Record<FamilyRole, { label: string; badge: string; icon: React.ReactNode; cardStyle: string; glow: string }> = {
  admin: { label: 'Admin', badge: 'Admin', icon: <Crown size={12} />, cardStyle: 'from-sky-600/20 to-blue-900/30', glow: 'shadow-[0_0_30px_rgba(96,165,250,0.25)]' },
  member: { label: 'Member', badge: 'Member', icon: <User size={12} />, cardStyle: 'from-slate-600/20 to-slate-950/30', glow: 'shadow-[0_0_30px_rgba(148,163,184,0.25)]' },
  protected: { label: 'Protected', badge: 'Protected', icon: <Shield size={12} />, cardStyle: 'from-emerald-600/20 to-emerald-950/30', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.25)]' },
  limited: { label: 'Limited', badge: 'Limited', icon: <Sparkles size={12} />, cardStyle: 'from-violet-600/20 to-fuchsia-950/30', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.25)]' },
};

export function FamilyVault({ members, selectedLockedMemberId, onEnterMember, onUnlockMember, onAddMember }: FamilyVaultProps) {
  const [activeMember, setActiveMember] = useState<FamilyMember | null>(null);
  const [pin, setPin] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<FamilyRole>('member');
  const [newPin, setNewPin] = useState('');
  const [shake, setShake] = useState(false);

  const lockedMember = useMemo(
    () => selectedLockedMemberId ? members.find(m => m.id === selectedLockedMemberId) : undefined,
    [members, selectedLockedMemberId]
  );

  useEffect(() => {
    if (lockedMember) {
      setActiveMember(lockedMember);
      setPin('');
      setUnlockError('');
    }
  }, [lockedMember]);

  const onSelect = (member: FamilyMember) => {
    if (member.id === selectedLockedMemberId) {
      setActiveMember(member);
      setPin('');
      setUnlockError('');
      return;
    }
    setActiveMember(member);
    setPin('');
    setUnlockError('');
  };

  const handleConfirmPin = async () => {
    if (!activeMember) return;
    const success = await onUnlockMember(activeMember.id, pin);
    if (success) {
      onEnterMember(activeMember.id);
      setActiveMember(null);
      setPin('');
      setUnlockError('');
    } else {
      setUnlockError('Incorrect PIN. Try again.');
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  };

  const handleAddMember = () => {
    if (!newName.trim() || !/^[0-9]{4}$/.test(newPin)) return;
    const id = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const member: FamilyMember = {
      id,
      name: newName.trim(),
      role: newRole,
      pin: newPin,
      lastLogin: 'Never',
      phoneLocked: false,
      healthScore: 85,
      netWorth: 0,
      avatar: newName.trim().charAt(0).toUpperCase() || '?',
      color: roleMeta[newRole].cardStyle,
      badge: roleMeta[newRole].label,
    };
    onAddMember(member);
    setNewName('');
    setNewPin('');
    setNewRole('member');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 relative text-white">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-7xl">
        <div className="grid gap-8">
          <div className="text-center mx-auto max-w-2xl space-y-4">
            <div className="text-5xl font-black tracking-tight">NATA<br />CONNECT</div>
            <p className="text-slate-300 text-lg">Welcome home.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {members.map(member => {
              const meta = roleMeta[member.role];
              return (
                <GlassCard
                  key={member.id}
                  className={`relative overflow-hidden p-6 cursor-pointer ${meta.glow}`}
                  hover
                  onClick={() => onSelect(member)}
                  style={{ backgroundImage: `radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(10,14,24,0.98))` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-900/10 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                        <div className="text-xs text-slate-400">{member.lastLogin}</div>
                      </div>
                    </div>
                    {(meta.badge && meta.badge !== 'Member' && meta.badge !== 'Protected') && (
                      <Badge variant="info" className="text-[10px] uppercase tracking-[0.15em]">
                        {meta.icon}
                        <span className="ml-1">{meta.badge}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                    <span>{member.role === 'admin' ? 'Vault owner' : 'Family member'}</span>
                    <span>{member.phoneLocked ? 'Locked' : 'Ready'}</span>
                  </div>
                </GlassCard>
              );
            })}

            <div className="flex items-center justify-center">
              <GlassCard className="p-6 border-dashed border-slate-600 text-slate-300 hover:text-white hover:border-slate-500" hover onClick={() => setShowAddModal(true)}>
                <div className="flex flex-col items-center gap-4 py-12">
                  <UserPlus size={32} />
                  <div className="text-lg font-semibold">Add Member</div>
                  <div className="text-sm text-slate-400">Create a new family account</div>
                </div>
              </GlassCard>
            </div>
          </div>

          <div className="text-center text-sm text-slate-400">
            Your family vault · Running locally on your Pi
          </div>
        </div>
      </div>

      {activeMember && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (selectedLockedMemberId) return;
            setActiveMember(null);
            setPin('');
            setUnlockError('');
          }}
          title={selectedLockedMemberId ? `Unlock ${activeMember.name}` : `Enter PIN for ${activeMember.name}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Enter the 4-digit PIN to continue.</p>
            <div className={`grid grid-cols-4 gap-3 ${shake ? 'animate-shake' : ''}`}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-14 rounded-2xl border border-slate-700 bg-slate-950/90 flex items-center justify-center text-xl text-white"
                >
                  {pin.length > idx ? '•' : ''}
                </div>
              ))}
            </div>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full glass-input rounded-2xl px-4 py-3 text-sm text-white outline-none"
            />
            {unlockError && <p className="text-sm text-rose-300">{unlockError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="md" onClick={() => { if (!selectedLockedMemberId) { setActiveMember(null); setPin(''); setUnlockError(''); } }}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirmPin} disabled={pin.length !== 4}>
                <Lock size={16} /> Unlock
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Family Member" size="sm">
        <div className="space-y-4">
          <label className="block text-sm text-slate-300">Name</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full glass-input rounded-2xl px-4 py-3 text-sm text-white outline-none"
            placeholder="Member name"
          />
          <label className="block text-sm text-slate-300">Role</label>
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as FamilyRole)}
            className="w-full glass-input rounded-2xl px-4 py-3 text-sm text-white outline-none bg-transparent"
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="protected">Protected</option>
            <option value="limited">Limited</option>
          </select>
          <label className="block text-sm text-slate-300">4-digit PIN</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full glass-input rounded-2xl px-4 py-3 text-sm text-white outline-none"
            placeholder="Enter PIN"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleAddMember} disabled={!newName.trim() || newPin.length !== 4}>
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
