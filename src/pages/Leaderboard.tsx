import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { UserProfile } from '../types/firebase';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown } from 'lucide-react';

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('points', '>=', 0),
      orderBy('points', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setTopUsers(snap.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    }, (err) => {
      console.error('Leaderboard error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-secondary/20 rounded-full mb-4">
          <Crown size={48} className="text-brand-secondary" fill="currentColor" />
        </div>
        <h2 className="text-4xl font-black tracking-tight">Leaderboard</h2>
        <p className="text-[#777] text-lg font-medium uppercase tracking-widest">Global Top Learners</p>
      </div>

      <div className="bg-white border-2 border-[#e5e5e5] rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : topUsers.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="text-6xl">🌍</div>
            <h3 className="text-2xl font-black">No leaders yet!</h3>
            <p className="text-gray-500 font-bold">Be the first to claim the Platinum Trophy.</p>
          </div>
        ) : (
          <>
            <div className="divide-y-2 divide-[#e5e5e5]">
              {topUsers.map((user, index) => {
                const isMe = user.uid === profile?.uid;
                const rank = index + 1;
                
                return (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    key={user.uid}
                    className={`flex items-center gap-4 p-6 ${isMe ? 'bg-[#ddf4ff]' : 'hover:bg-[#fcfcfc]'} transition-colors`}
                  >
                    <div className="w-10 text-center font-black text-2xl flex items-center justify-center">
                      {rank === 1 ? (
                        <Trophy className="text-[#D9E4EC] drop-shadow-[0_0_12px_rgba(217,228,236,0.8)]" fill="currentColor" size={28} title="Platinum" />
                      ) : rank <= 3 ? (
                        <Trophy className="text-[#FFD700]" fill="currentColor" size={24} title="Gold" />
                      ) : rank <= 6 ? (
                        <Trophy className="text-[#C0C0C0]" fill="currentColor" size={24} title="Silver" />
                      ) : (
                        <span className="text-[#afafaf] text-xl">{rank}</span>
                      )}
                    </div>
                    
                    <div className="w-12 h-12 rounded-full bg-[#e5e5e5] overflow-hidden border-2 border-white flex-shrink-0">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-primary flex items-center justify-center text-white font-bold">
                          {(user.displayName || 'u')[0]}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xl flex items-center gap-2 truncate">
                        <span className="truncate">{user.displayName || 'Learner #' + user.uid.slice(0, 4)}</span>
                        {isMe && <span className="text-[10px] bg-brand-accent text-white px-2 py-0.5 rounded-md uppercase tracking-widest font-black shrink-0">You</span>}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className="font-black text-brand-primary text-xl leading-none">{user.points}</div>
                      <div className="text-[9px] font-black uppercase text-[#afafaf] tracking-widest mt-1">XP</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {topUsers.length === 1 && topUsers[0].uid === profile?.uid && (
              <div className="p-8 bg-brand-primary/5 text-center border-t-2 border-[#e5e5e5]">
                <p className="text-sm font-bold text-brand-primary uppercase tracking-widest">
                  You're the only explorer here! Invite friends to compete.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {!loading && !topUsers.find(u => u.uid === profile?.uid) && (
        <div className="bg-[#ddf4ff] border-2 border-[#84d8ff] rounded-2xl p-6 flex items-center gap-4">
          <div className="w-10 text-center font-black text-xl text-brand-accent">?</div>
          <div className="flex-1 font-bold text-lg">{profile?.displayName}</div>
          <div className="text-right">
            <div className="font-black text-brand-accent text-xl">{profile?.points}</div>
            <div className="text-[10px] font-bold uppercase text-[#84d8ff]">Your XP</div>
          </div>
        </div>
      )}
    </div>
  );
}
