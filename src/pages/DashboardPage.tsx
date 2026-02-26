import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Map as MapIcon, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Navigation,
  Search,
  ArrowRight,
  Leaf
} from 'lucide-react';
import { getUsers, getAllRegisteredParks, type ParkProfile } from '../lib/db';
import type { UserStats } from '../components/squads/UserProfileModal';
import './DashboardPage.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const [locationContext, setLocationContext] = useState<'immediate' | 'patrol'>('immediate');
  const [parks, setParks] = useState<ParkProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [users, allParks] = await Promise.all([
          getUsers(),
          getAllRegisteredParks()
        ]);
        
        setCurrentUser(users[0]); // Captain persona
        
        // Mocking "immediate" vs "patrol" filter
        // In reality, this would use Geolocation bounds
        if (locationContext === 'immediate') {
          setParks(allParks.slice(0, 6)); // Just a sample
        } else {
          setParks(allParks.filter(p => p.integrity < 100 || p.isCustom).slice(0, 6));
        }
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [locationContext]);

  const stats = [
    { label: 'Territory Integrity', value: '82%', icon: <Shield size={20} />, color: 'text-accent-blue' },
    { label: 'Active Hazards', value: '12', icon: <AlertTriangle size={20} />, color: 'text-accent-orange' },
    { label: 'Squad Rank', value: '#3', icon: <TrendingUp size={20} />, color: 'text-accent-purple' },
    { label: 'Rangers On-Duty', value: '4', icon: <Users size={20} />, color: 'text-accent-green' },
  ];

  return (
    <div className="dashboard-page animate-fade-in flex flex-col h-full bg-bg-dark overflow-y-auto pb-12">
      {/* Hero Header */}
      <div className="dashboard-hero pt-48 pb-12 px-6 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-green/10 via-bg-dark to-accent-purple/10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-green/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black mb-3 m-0 text-white tracking-tight">
                Ranger Dashboard
              </h1>
              <p className="text-xl text-text-secondary max-w-xl leading-relaxed">
                Welcome back, Agent {currentUser?.name || "Captain"}. Your local patrol zone is currently at <span className="text-accent-green font-bold text-shadow-glow">82% integrity</span>.
              </p>
            </div>
            
            <div className="flex bg-surface-dark border border-white/5 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl shrink-0">
              <button 
                onClick={() => setLocationContext('immediate')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${locationContext === 'immediate' ? 'bg-accent-green text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <Navigation size={18} /> Immediate Area
              </button>
              <button 
                onClick={() => setLocationContext('patrol')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${locationContext === 'patrol' ? 'bg-accent-purple text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                <Shield size={18} /> Patrol Zone
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input 
                type="text" 
                placeholder="Search for local territories or ranger units..." 
                className="w-full bg-surface-dark border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all shadow-xl"
              />
            </div>
            <button className="btn btn-primary px-8 h-[60px] rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-accent-green/20 shrink-0">
               <Search size={20} /> Scout Region
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-border-light hover:border-white/20 transition-all group shadow-xl">
                <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-sm text-text-muted font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold m-0 flex items-center gap-3">
             <MapIcon className="text-accent-green" /> Local Territories
          </h2>
          <button 
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 text-accent-green font-bold hover:underline"
          >
            Open Tactical Map <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parks.length > 0 ? parks.map((park) => (
              <div 
                key={park.id} 
                className="park-card glass-panel rounded-2xl overflow-hidden border border-border-light hover:border-accent-green/50 transition-all cursor-pointer shadow-lg group flex flex-col"
                onClick={() => navigate(`/park/${park.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, { 
                  state: { 
                    parkName: park.name, 
                    dbParkId: park.id,
                    parkPhoto: park.photoUrl
                  } 
                })}
              >
                <div className="relative h-48 bg-bg-dark">
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/20 to-transparent z-10"></div>
                  <img 
                    src={park.photoUrl || `https://images.unsplash.com/photo-1495584816685-4bdbf1b5057e?auto=format&fit=crop&q=80&w=800&idx=${park.id}`} 
                    alt={park.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 z-20">
                     <div className={`px-3 py-1 rounded-full text-xs font-black shadow-xl backdrop-blur-md border ${park.integrity < 100 ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/40' : 'bg-accent-green/20 text-accent-green border-accent-green/40'}`}>
                        {park.integrity}% Healthy
                     </div>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-black mb-2 group-hover:text-accent-green transition-colors">{park.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-text-muted mb-4">
                     <span className="flex items-center gap-1"><Navigation size={14} /> 1.2 mi</span>
                     <span className="flex items-center gap-1"><Users size={14} /> 2 Rangers</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                     <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-bg-dark bg-accent-blue flex items-center justify-center text-xs font-bold">🧑‍🌾</div>
                        <div className="w-8 h-8 rounded-full border-2 border-bg-dark bg-accent-purple flex items-center justify-center text-xs font-bold">🦸</div>
                        <div className="w-8 h-8 rounded-full border-2 border-bg-dark bg-surface-dark flex items-center justify-center text-xs font-bold text-text-muted">+2</div>
                     </div>
                     <span className="text-xs font-black uppercase tracking-widest text-text-muted group-hover:text-accent-green transition-colors">View Intel</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-24 text-center glass-panel rounded-2xl border border-dashed border-border-light">
                <Leaf size={48} className="text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-bold">No Territories Scaned</h3>
                <p className="text-text-muted">Launch map ops to initialize your patrol zone.</p>
                <button onClick={() => navigate('/map')} className="btn btn-primary mt-6">Launch Map Ops</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
