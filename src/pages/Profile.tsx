import React from 'react';
import { useAuth } from '../App';
import { db, signOut } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { calculateLevel } from '../lib/srs';
import { 
  LogOut, 
  Share2, 
  Trophy, 
  Flame, 
  Target,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { profile, user } = useAuth();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BrainBloom',
        text: `I've reached Level ${profile?.level} on BrainBloom! Join me and master everything with active recall.`,
        url: window.location.origin
      }).catch(console.error);
    } else {
      alert('Copy this link to share BrainBloom: ' + window.location.origin);
    }
  };

  // Badge Definitions & Earned Logic
  const badgeDefinitions = [
    { name: 'First Lesson', req: 'Complete 1 lesson', icon: '🏆', color: 'text-brand-secondary', benchmark: profile.points > 0 },
    { name: '7-Day Streak', req: '7 days in a row', icon: '🔥', color: 'text-brand-danger', benchmark: profile.streak >= 7 },
    { name: 'Scholar', req: 'Reach Level 2', icon: '🎯', color: 'text-brand-purple', benchmark: profile.level >= 2 },
    { name: 'Explorer', req: 'Try 3 different courses', icon: '🗺️', color: 'text-brand-accent', benchmark: (profile.unlockedDecks?.length || 0) >= 3 },
    { name: 'Socialite', req: 'Share progress', icon: '🤝', color: 'text-green-500', benchmark: false }, // Mock
    { name: 'Sage', req: 'Reach Level 5', icon: '🛡️', color: 'text-orange-500', benchmark: profile.level >= 5 },
  ];

  const earnedBadgesCount = badgeDefinitions.filter(b => b.benchmark).length;

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header Profile */}
      <div className="flex flex-col items-center mt-8 mb-12">
        <div className="relative mb-6">
          <div className="w-40 h-40 rounded-[2.5rem] bg-brand-primary border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-white text-6xl font-bold">
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.displayName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              profile.displayName[0]
            )}
          </div>
          <div className="absolute bottom-2 right-2 bg-brand-secondary p-3 rounded-2xl border-4 border-white shadow-lg">
            <Trophy size={24} className="text-white" fill="currentColor" />
          </div>
        </div>
        
        <h2 className="text-4xl font-black mb-2">{profile.displayName}</h2>
        <p className="text-[#777] font-bold uppercase tracking-[0.2em]">{user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { icon: Flame, color: 'text-brand-danger', val: profile.streak, label: 'Day Streak' },
          { icon: Target, color: 'text-brand-accent', val: profile.points, label: 'Total XP' },
          { icon: Trophy, color: 'text-brand-secondary', val: profile.level, label: 'Current Level' },
          { icon: Trophy, color: 'text-brand-purple', val: earnedBadgesCount, label: 'Badges earned' }
        ].map((stat, i) => (
          <div key={i} className="bg-white border-2 border-[#e5e5e5] p-6 rounded-3xl text-center flex flex-col items-center">
            <stat.icon className={`${stat.color} mb-2`} fill="currentColor" />
            <div className="text-2xl font-black">{stat.val}</div>
            <div className="text-[10px] font-bold text-[#afafaf] uppercase tracking-widest">{stat.label}</div>
            
            {stat.label === 'Total XP' && (
              <button 
                onClick={async () => {
                  if (!profile) return;
                  const userRef = doc(db, 'users', profile.uid);
                  const newXP = profile.points + 50;
                  const newLevel = calculateLevel(newXP);
                  await updateDoc(userRef, { 
                    points: newXP,
                    level: newLevel
                  });
                }}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-accent hover:bg-brand-accent/5 px-3 py-1.5 rounded-xl border border-brand-accent/20 transition-all"
                title="Add 50 XP (Dev Booster)"
              >
                + XP Boost
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Badges Section */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6">Badges & Milestones</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badgeDefinitions.map((badge, i) => (
            <motion.div 
              key={badge.name}
              whileHover={badge.benchmark ? { scale: 1.1, rotate: 5 } : {}}
              className={`flex flex-col items-center gap-3 ${badge.benchmark ? '' : 'opacity-30'}`}
            >
              <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center text-3xl shadow-sm border-2 ${
                badge.benchmark ? 'bg-white border-brand-secondary' : 'bg-gray-100 border-transparent'
              }`}>
                <span>{badge.icon}</span>
                {!badge.benchmark && <span className="text-[8px] font-black uppercase text-gray-400 mt-1">Locked</span>}
              </div>
              <div className="text-center">
                <div className="text-xs font-black uppercase leading-tight">{badge.name}</div>
                <div className="text-[10px] font-bold text-[#afafaf] uppercase tracking-tighter">{badge.req}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button 
          onClick={handleShare}
          className="w-full btn-secondary text-brand-accent border-brand-accent flex items-center justify-center gap-3 py-4"
        >
          <Share2 size={24} />
          SHARE PROGRESS
        </button>
        <button 
          onClick={() => signOut()}
          className="w-full btn-secondary text-brand-danger border-brand-danger flex items-center justify-center gap-3 py-4"
        >
          <LogOut size={24} />
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
