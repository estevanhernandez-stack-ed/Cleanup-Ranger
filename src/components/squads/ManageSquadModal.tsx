import { useState, useEffect } from 'react';
import { X, Users, Trophy, Shield, Plus } from 'lucide-react';
import '../scanner/DriftScanner.css'; // Reuse overlay/modal styles
import { UserProfileModal } from './UserProfileModal';
import { getUsers } from '../../lib/db';
import type { UserStats } from './UserProfileModal';

const SQUAD_STATS = {
  totalCleanups: 47,
  totalHazards: 23,
  streak: 5,
  rank: 3,
};

interface ManageSquadModalProps {
  onClose: () => void;
}

export function ManageSquadModal({ onClose }: ManageSquadModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'stats'>('members');
  const [selectedMember, setSelectedMember] = useState<UserStats | null>(null);
  const [squadMembers, setSquadMembers] = useState<UserStats[]>([]);

  useEffect(() => {
    getUsers()
      .then(users => setSquadMembers(users))
      .catch(err => console.error("Error fetching squad members:", err));
  }, []);

  if (selectedMember) {
    return <UserProfileModal user={selectedMember} onClose={() => setSelectedMember(null)} />;
  }

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div 
        className="scanner-modal glass-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="scanner-header flex items-center">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-accent-purple" />
            <h3>Green Guardians</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light">
          <button
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              activeTab === 'members' 
                ? 'text-accent-purple border-b-2 border-accent-purple' 
                : 'text-text-muted hover:text-text-secondary'
            }`}
            onClick={() => setActiveTab('members')}
          >
            <Users size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Members ({squadMembers.length})
          </button>
          <button
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              activeTab === 'stats' 
                ? 'text-accent-purple border-b-2 border-accent-purple' 
                : 'text-text-muted hover:text-text-secondary'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            <Trophy size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Stats
          </button>
        </div>

        {/* Body */}
        <div className="scanner-body">
          {activeTab === 'members' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {squadMembers.map((member, i) => (
                <div 
                  key={member.name || i}
                  className="park-card flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                  style={{ padding: '0.75rem 1rem' }}
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.5rem' }}>{member.avatar}</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{member.name}</p>
                      <p className="text-xs text-text-muted">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-green">{member.points.toLocaleString()}</p>
                    <p className="text-xs text-text-muted">pts</p>
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary w-full flex items-center justify-center gap-2 mt-2 border-dashed border border-border-light">
                <Plus size={16} />
                Invite Member
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="park-card" style={{ padding: '1rem' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-secondary">Territory Rank</p>
                  <p className="text-xl font-bold text-accent-purple">#{SQUAD_STATS.rank}</p>
                </div>
                <div className="health-bar">
                  <div className="health-fill bg-accent-purple" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-text-muted mt-1">Top 15% of squads in your area</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="park-card text-center" style={{ padding: '1rem' }}>
                  <p className="text-2xl font-bold text-accent-green">{SQUAD_STATS.totalCleanups}</p>
                  <p className="text-xs text-text-muted mt-1">Cleanups</p>
                </div>
                <div className="park-card text-center" style={{ padding: '1rem' }}>
                  <p className="text-2xl font-bold text-accent-orange">{SQUAD_STATS.totalHazards}</p>
                  <p className="text-xs text-text-muted mt-1">Hazards Reported</p>
                </div>
                <div className="park-card text-center" style={{ padding: '1rem' }}>
                  <p className="text-2xl font-bold text-accent-purple">🔥 {SQUAD_STATS.streak}</p>
                  <p className="text-xs text-text-muted mt-1">Day Streak</p>
                </div>
                <div className="park-card text-center" style={{ padding: '1rem' }}>
                  <p className="text-2xl font-bold text-text-primary">🏅 3</p>
                  <p className="text-xs text-text-muted mt-1">Badges</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
