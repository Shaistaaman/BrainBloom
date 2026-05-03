import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Trophy, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { Deck } from '../types/firebase';
import { Link } from 'react-router-dom';

export default function Home() {
  const { profile } = useAuth();
  const [dueDecks, setDueDecks] = useState<(Deck & { count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDueDecks() {
      if (!profile) return;
      
      // Handle daily goal reset
      const today = new Date().toISOString().split('T')[0];
      if (profile.lastGoalReset !== today) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          dailyXP: 0,
          lastGoalReset: today
        });
      }

      // For this demo, let's fetch some sample decks
      // In a real app, we would query userProgress to find due cards
      const decksSnap = await getDocs(query(collection(db, 'decks'), limit(3)));
      const decks = decksSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        count: Math.floor(Math.random() * 20) + 5 // Mock due count
      })) as (Deck & { count: number })[];
      
      setDueDecks(decks);
      setLoading(false);
    }

    fetchDueDecks();
  }, [profile]);

  const dailyGoal = 50;
  const dailyProgress = Math.min(((profile?.dailyXP || 0) / dailyGoal) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-1">Welcome back, {profile?.displayName}!</h2>
          <p className="text-[#777] text-lg">You've reached level {profile?.level}. Keep it up!</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-4 flex items-center gap-3">
            <Flame className="text-brand-danger" fill="currentColor" />
            <div>
              <div className="font-bold text-xl leading-none">{profile?.streak}</div>
              <div className="text-xs uppercase font-bold text-[#afafaf]">Streak</div>
            </div>
          </div>
          <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-4 flex items-center gap-3">
            <Sparkles className="text-brand-secondary" fill="currentColor" />
            <div>
              <div className="font-bold text-xl leading-none">{profile?.points}</div>
              <div className="text-xs uppercase font-bold text-[#afafaf]">XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal Card */}
      <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Daily Goal</h3>
          <p className="text-[#777] mb-6">Complete {dailyGoal} XP today to keep your streak!</p>
          
          <div className="w-full bg-[#e5e5e5] h-4 rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress}%` }}
              className="h-full bg-brand-primary"
            />
          </div>
          <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-black text-brand-primary uppercase tracking-widest">{profile?.dailyXP || 0} / {dailyGoal} XP</span>
            {dailyProgress >= 100 && <span className="text-[10px] font-black text-white bg-brand-primary px-2 py-0.5 rounded-full uppercase">Goal Met!</span>}
          </div>

          <Link to="/learn" className="btn-primary inline-flex">
            START LEARNING
          </Link>
        </div>
        
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy size={160} />
        </div>
      </div>

      {/* Due for Review */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold uppercase tracking-wide text-[#777]">Due for Review</h3>
          <Link to="/learn" className="text-brand-accent font-bold uppercase hover:underline">View All</Link>
        </div>
        
        <div className="grid gap-4">
          {loading ? (
            <div className="h-24 bg-white border-2 border-[#e5e5e5] rounded-2xl animate-pulse" />
          ) : dueDecks.length > 0 ? (
            dueDecks.map((deck) => (
              <motion.div 
                key={deck.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Link 
                  to={`/session/${deck.id}`}
                  className="bg-white border-2 border-[#e5e5e5] border-b-4 hover:border-brand-accent rounded-2xl p-6 flex items-center gap-4 group transition-all"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                    style={{ backgroundColor: `${deck.color}20`, color: deck.color }}
                  >
                    {deck.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold">{deck.title}</h4>
                    <div className="flex items-center gap-2 text-[#afafaf] font-bold text-sm uppercase">
                      <Clock size={16} />
                      <span>{deck.count} CARDS READY</span>
                    </div>
                  </div>
                  <ChevronRight className="text-[#e5e5e5] group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-12 text-center">
              <Sparkles size={48} className="mx-auto text-brand-secondary mb-4" />
              <p className="text-[#a0a0a0] font-bold text-xl uppercase tracking-widest">Wow! You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Badges/Unlock Progress */}
      <div className="bg-brand-purple/10 border-2 border-brand-purple/30 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-purple" />
            <h3 className="text-xl font-bold text-brand-purple uppercase">Milestones</h3>
          </div>
          <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest bg-brand-purple/10 px-2 py-1 rounded-md">
            {profile?.badges?.length || 0} / 4 Earned
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2 pt-2 mx-2">
          {['Explorer', 'Scholar', 'Memory Master', 'Visionary'].map((badge) => {
            const isEarned = profile?.badges?.includes(badge);
            return (
              <div 
                key={badge} 
                className={`flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                  isEarned 
                    ? 'bg-white border-brand-purple shadow-lg scale-105' 
                    : 'bg-white/50 border-transparent opacity-40 grayscale'
                }`}
                title={isEarned ? `Earned ${badge}` : `${badge} (Locked)`}
              >
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${isEarned ? 'animate-bounce' : ''}`}>
                    {badge === 'Explorer' ? '🧭' : badge === 'Scholar' ? '📚' : badge === 'Memory Master' ? '🧠' : '✨'}
                  </div>
                  <div className={`text-[10px] font-black uppercase ${isEarned ? 'text-brand-purple' : 'text-gray-400'}`}>
                    {badge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
