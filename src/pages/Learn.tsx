import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Deck } from '../types/firebase';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { DEMO_DECKS } from '../constants';
import { Trophy, Star, Lock, ChevronRight, CheckCircle2, Trash2, Edit2, Flame, PlusCircle } from 'lucide-react';
import { pointsToNextLevel } from '../lib/srs';
import { deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';

export default function Learn() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    async function fetchDecks() {
      try {
        setLoading(true);
        // Query public decks (no owner) and user's private decks separately
        const publicQuery = query(collection(db, 'decks'), where('ownerId', '==', null));
        const privateQuery = query(collection(db, 'decks'), where('ownerId', '==', profile.uid));
        
        let publicDocs: any[] = [];
        let privateDocs: any[] = [];

        try {
          const publicSnap = await getDocs(publicQuery);
          publicDocs = publicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deck));
        } catch (e) {
          console.error("Public decks fetch failed:", e);
        }

        try {
          const privateSnap = await getDocs(privateQuery);
          privateDocs = privateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deck));
        } catch (e) {
          console.error("Private decks fetch failed:", e);
          handleFirestoreError(e, OperationType.LIST, 'decks/private');
        }

        const firestoreDecks = [...publicDocs, ...privateDocs];
        
        const deckMap = new Map<string, Deck>();
        // Add demo decks from constants
        DEMO_DECKS.forEach(d => deckMap.set(d.id, d));
        // Add/Overwrite with Firestore decks
        firestoreDecks.forEach(d => deckMap.set(d.id, d));
        
        const sortedDecks = Array.from(deckMap.values()).sort((a: Deck, b: Deck) => {
          const aLvl = a.minLevel || 1;
          const bLvl = b.minLevel || 1;
          if (aLvl !== bLvl) return aLvl - bLvl;
          // Put personal courses first within a level
          const aIsPersonal = a.ownerId === profile.uid;
          const bIsPersonal = b.ownerId === profile.uid;
          if (aIsPersonal && !bIsPersonal) return -1;
          if (!aIsPersonal && bIsPersonal) return 1;
          return a.title.localeCompare(b.title);
        });
        
        setDecks(sortedDecks);
      } catch (error) {
        console.error('Error fetching decks:', error);
        setDecks(DEMO_DECKS);
      } finally {
        setLoading(false);
      }
    }
    fetchDecks();
  }, [profile]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, deckId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirmDeleteId !== deckId) {
      setConfirmDeleteId(deckId);
      setTimeout(() => setConfirmDeleteId(null), 3000); // Reset after 3s
      return;
    }

    setDeletingId(deckId);
    setConfirmDeleteId(null);
    try {
      await deleteDoc(doc(db, 'decks', deckId));
      setDecks(prev => prev.filter(d => d.id !== deckId));
    } catch (err) {
      console.error('Delete error:', err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `decks/${deckId}`);
      } catch (e: any) {
        alert('Could not delete course: ' + (e.message || 'Permission denied'));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const currentPoints = profile?.points || 0;
  const userLevel = profile?.level || 1;
  const xpNeededForNext = pointsToNextLevel(currentPoints);

  const PHYSICAL_MILESTONES: Record<number, string> = {
    1: "5s Breathing",
    2: "3x Sit-Stands",
    3: "5s Observation",
    4: "Change Your Position",
    5: "Say Hello to Self",
    6: "Smile 3 Seconds",
    7: "Say Thank You to Self",
    8: "3 Seconds Gratitude",
    9: "Say a Positive Word to Self"
  };



  // Fixed 10 levels as requested
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Global Progress Math
  const xpForCurrentLevel = Math.pow(userLevel - 1, 2) * 50;
  const xpForNextLevel = Math.pow(userLevel, 2) * 50;
  const xpInTotalForThisLevel = xpForNextLevel - xpForCurrentLevel;
  const xpEarnedInThisLevel = Math.max(0, currentPoints - xpForCurrentLevel);
  const progressPercent = Math.min(Math.max((xpEarnedInThisLevel / xpInTotalForThisLevel) * 100, 0), 100);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-brand-primary animate-pulse uppercase tracking-[0.3em]">Loading Map...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Progression Header */}
      <div className="bg-white border-2 border-[#e5e5e5] rounded-3xl p-8 mb-16 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="w-32 h-32 bg-brand-secondary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white transition-transform hover:scale-110 duration-500">
          <div className="text-center">
             <div className="text-sm font-black uppercase opacity-80">Level</div>
             <div className="text-5xl font-black leading-none">{userLevel}</div>
          </div>
        </div>
        
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-3xl font-black">Your Learning Path</h2>
            <div className="flex items-center gap-2 bg-brand-danger/10 px-4 py-2 rounded-2xl border border-brand-danger/20">
              <Flame className="text-brand-danger" fill="currentColor" size={20} />
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black text-brand-danger">{profile?.streak || 0}</span>
                <span className="text-[10px] uppercase font-black text-brand-danger opacity-70">Day Streak</span>
              </div>
            </div>
          </div>
          <p className="text-[#777] font-bold mb-4 uppercase tracking-widest flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Star size={18} fill="currentColor" className="text-brand-secondary" />
              {xpNeededForNext} XP to reach Level {userLevel + 1}
            </span>

          </p>
          
          <div className="w-full bg-[#f0f0f0] h-6 rounded-2xl overflow-hidden shadow-inner border-2 border-white">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-brand-secondary shadow-[0_4px_0_0_rgba(229,160,0,1)]"
            />
          </div>
        </div>

        <div className="hidden lg:block w-px h-24 bg-[#e5e5e5]" />

        <div className="flex flex-wrap justify-center lg:justify-start gap-4 p-4 bg-white/50 rounded-[2.5rem] border-2 border-[#e5e5e5] shadow-inner">
           {[
             { name: 'First Lesson', icon: '🏆', req: '> 0 XP', benchmark: (profile?.points || 0) > 0 },
             { name: '7-Day Streak', icon: '🔥', req: '7 days', benchmark: (profile?.streak || 0) >= 7 },
             { name: 'Scholar', icon: '🎯', req: 'Level 2', benchmark: (profile?.level || 1) >= 2 },
             { name: 'Explorer', icon: '🗺️', req: '3 Courses', benchmark: (profile?.unlockedDecks?.length || 0) >= 3 },
             { name: 'Sage', icon: '🛡️', req: 'Level 5', benchmark: (profile?.level || 1) >= 5 },
           ].map((badge, i) => (
             <div key={badge.name} className="text-center group relative flex flex-col items-center">
               <motion.div 
                 whileHover={badge.benchmark ? { scale: 1.1, rotate: 5, y: -5 } : {}}
                 className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-1 transition-all duration-500 shadow-sm border-2 ${
                 badge.benchmark 
                  ? "bg-white border-brand-secondary scale-100 ring-8 ring-brand-secondary/5" 
                  : "bg-[#f7f7f7] border-transparent opacity-30 grayscale scale-90"
               }`}>
                  <span className="text-3xl">{badge.icon}</span>
                  {badge.benchmark ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-brand-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                    >
                      <CheckCircle2 size={12} className="text-white" />
                    </motion.div>
                  ) : (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                      <Lock size={10} className="text-white" />
                    </div>
                  )}
               </motion.div>
               <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                 badge.benchmark ? "text-gray-900" : "text-[#afafaf]"
               }`}>
                 {badge.name}
               </span>
               <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">{badge.req}</span>
               
               {/* Advanced Tooltip */}
               <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 px-4 py-3 bg-gray-900/95 backdrop-blur-md text-white text-xs font-bold rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-[-10px] whitespace-nowrap pointer-events-none z-50 shadow-2xl border border-white/10 min-w-[140px]">
                 <div className="flex items-center gap-3 mb-1">
                   <span className="text-xl">{badge.icon}</span>
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase tracking-tighter">{badge.name}</span>
                     <span className={`text-[8px] font-black ${badge.benchmark ? 'text-brand-secondary' : 'text-brand-accent'}`}>
                       {badge.benchmark ? 'ACHIEVED' : 'IN PROGRESS'}
                     </span>
                   </div>
                 </div>
                 <div className="pt-2 border-t border-white/10 text-[9px] text-gray-400 leading-tight">
                   {badge.benchmark ? 'Milestone cleared! Well done.' : `Requires: ${badge.req}`}
                 </div>
                 {/* Tooltip Arrow */}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95" />
               </div>
             </div>
           ))}
        </div>
      </div>

      {levels.map((lvl: number, index) => {
        const levelDecks = decks.filter(d => d.minLevel === lvl);
        return (
          <div key={lvl} className="mb-20">
            {/* Level Section Heading */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${userLevel >= lvl ? 'bg-brand-primary text-white border-brand-primary/20' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                {lvl}
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-gray-800 flex items-center gap-3">
                Level {lvl} 
                <span className="text-gray-300">Stages</span>
                <span className="bg-[#f0f0f0] text-gray-400 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-widest translate-y-[-2px]">
                  {levelDecks.length} {levelDecks.length === 1 ? 'COURSE' : 'COURSES'}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {levelDecks.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-white/30 border-4 border-dashed border-gray-200 rounded-[3rem] text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-[#aaaaaa] mb-4">
                    <PlusCircle size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-400 mb-2 tracking-tight uppercase">Empty Level Group</h4>
                  <p className="text-gray-400 text-sm max-w-xs mb-6">No courses available for Level {lvl} yet. Create one to start learning!</p>
                  <Link 
                    to={`/create?level=${lvl}`}
                    className="bg-white text-brand-primary border-2 border-brand-primary px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_4px_0_0_#64b40010] hover:bg-brand-primary hover:text-white transition-all"
                  >
                    Build Course
                  </Link>
                </div>
              ) : (
                levelDecks.map((deck) => {
                  const isLocked = userLevel < deck.minLevel;
                  const isPersonal = deck.ownerId === profile?.uid;
                  const requiredXP = Math.pow(deck.minLevel - 1, 2) * 50;
                  
                  return (
                    <motion.div
                      key={deck.id}
                      whileHover={isLocked ? {} : { y: -8 }}
                      whileTap={isLocked ? {} : { scale: 0.98 }}
                      className={`relative ${isLocked ? 'grayscale' : ''}`}
                    >
                      <div 
                        className={`card-flat h-full flex flex-col border-b-8 min-h-[320px] transition-all duration-300 ${
                          isLocked ? 'bg-[#f7f7f7] border-gray-300' : 
                          isPersonal ? 'bg-white border-brand-purple hover:border-brand-purple shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'bg-white hover:border-b-12'
                        }`}
                        style={isLocked ? {} : { borderBottomColor: isPersonal ? '#8e41af' : deck.color }}
                      >
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 relative"
                          style={{ 
                            backgroundColor: isLocked ? '#e5e5e5' : isPersonal ? '#8e41af15' : `${deck.color}20`, 
                            color: isLocked ? '#a0a0a0' : isPersonal ? '#8e41af' : deck.color 
                          }}
                        >
                          {deck.icon}
                          {isLocked && (
                            <div className="absolute -top-2 -right-2 bg-gray-600 rounded-full p-1 border-2 border-white shadow-md">
                              <Lock size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-2xl font-black">{deck.title}</h3>
                          {isPersonal && (
                            <div className="flex items-center gap-2">
                                <Link
                                  to={`/create?edit=${deck.id}`}
                                  className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all relative z-20"
                                  title="Edit Course"
                                >
                                   <Edit2 size={16} />
                                </Link>
                                <button 
                                  onClick={(e) => handleDelete(e, deck.id)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  disabled={deletingId === deck.id}
                                  className={`p-2 transition-all relative z-20 rounded-xl flex items-center gap-2 ${
                                    deletingId === deck.id 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                    : confirmDeleteId === deck.id
                                    ? "bg-brand-danger text-white px-3"
                                    : "text-gray-400 hover:text-brand-danger hover:bg-brand-danger/10"
                                  }`}
                                  title={confirmDeleteId === deck.id ? "Click again to confirm" : "Delete Course"}
                                >
                                   {deletingId === deck.id ? (
                                     <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                                   ) : confirmDeleteId === deck.id ? (
                                     <span className="text-[10px] font-black uppercase">Confirm?</span>
                                   ) : (
                                     <Trash2 size={16} />
                                   )}
                                </button>
                               <span className="bg-brand-purple/10 text-brand-purple text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-wider">Personal</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[#777] mb-8 flex-1 font-bold leading-snug">{deck.description}</p>
                        
                        <div className="mt-auto">
                          {isLocked ? (
                            <div className="space-y-3">
                              <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest items-center">
                                <span>Locked</span>
                                <span className="bg-gray-200 px-2 py-1 rounded-md">{currentPoints}/{requiredXP} XP</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-100">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min((currentPoints / requiredXP) * 100, 100)}%` }}
                                  className="h-full bg-gray-400" 
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f0]">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#afafaf]">
                                 Stage {lvl} Access
                              </div>
                              <Link 
                                to={`/session/${deck.id}`}
                                className="group px-8 py-3 bg-brand-accent text-white font-black rounded-2xl text-sm shadow-[0_5px_0_0_rgba(18,150,210,1)] hover:shadow-[0_2px_0_0_rgba(18,150,210,1)] hover:translate-y-1 active:shadow-none active:translate-y-2 transition-all flex items-center gap-2"
                              >
                                PLAY <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

          {/* Milestone Challenge between levels */}
          {PHYSICAL_MILESTONES[lvl] && (
            <div className="mt-16 flex flex-col items-center">
              <div className="w-px h-16 bg-gradient-to-b from-gray-300 to-transparent mb-4" />
              <div className={`p-8 md:p-12 rounded-[3rem] border-4 border-dashed flex flex-col items-center text-center max-w-2xl w-full transition-all duration-500 relative overflow-hidden ${
                userLevel > lvl 
                  ? 'bg-brand-primary/5 border-brand-primary/30' 
                  : 'bg-[#f7f7f7] border-gray-200'
              }`}>
                {userLevel <= lvl && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-400 mb-4 shadow-sm border-2 border-gray-100">
                      <Lock size={40} />
                    </div>
                    <div className="text-gray-600 font-black uppercase tracking-widest text-sm mb-4">
                      Goal: Reach Stage {lvl + 1}
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                         <span>Progress</span>
                         <span>{profile?.points || 0} / {Math.pow(lvl, 2) * 50} XP</span>
                       </div>
                       <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-white">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((profile?.points || 0) / (Math.pow(lvl, 2) * 50)) * 100, 100)}%` }}
                            className="h-full bg-brand-secondary"
                          />
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold italic">
                         {levelDecks.length === 0 
                           ? "Create a course in this stage to earn XP faster!" 
                           : "Play any course to earn the required XP."}
                       </p>
                    </div>
                  </div>
                )}

                <div className={`transition-all duration-500 w-full ${userLevel <= lvl ? 'blur-md grayscale opacity-20 select-none' : ''}`}>
                  <div className="w-24 h-24 bg-brand-primary rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-[0_8px_0_0_rgba(100,180,0,1)] mx-auto">
                     <Star size={44} fill="currentColor" />
                  </div>
                  
                  <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">Stage {lvl} Completed</h3>
                  <p className="text-lg text-gray-600 mb-12 font-bold max-w-md mx-auto">
                     Physical grounding challenge for your focus.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-[#e5e5e5] text-left">
                       <div className="text-brand-accent font-black uppercase text-[10px] mb-2 tracking-widest">Requirement</div>
                       <div className="text-xl font-bold flex items-center gap-2">
                          {PHYSICAL_MILESTONES[lvl]}
                          <span className="text-[10px] text-gray-400 font-normal">Physical Challenge</span>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-[#e5e5e5] text-left flex items-center justify-between">
                       <div className="flex flex-col">
                         <div className="text-brand-accent font-black uppercase text-[10px] mb-2 tracking-widest">Result</div>
                         <div className="text-xl font-bold flex items-center gap-2 text-brand-primary">
                            <CheckCircle2 size={24} /> Verified
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      );
    })}
    </div>
  );
}
