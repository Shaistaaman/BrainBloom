import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  RotateCcw, 
  HelpCircle,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  increment,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { Card, CardProgress } from '../types/firebase';
import { calculateNextReview, calculateLevel, calculateStreak } from '../lib/srs';
import { playSound, triggerLevelUpConfetti, triggerSuccessConfetti } from '../lib/effects';
import PhysicalChallenge, { ChallengeType } from '../components/PhysicalChallenge';
import { DEMO_DECKS, DEMO_CARDS } from '../constants';

export default function Session() {
  const { deckId } = useParams<{ deckId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    async function initSession() {
      if (!deckId) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Cards
        const cardsPath = `decks/${deckId}/cards`;
        let cardsSnap = await getDocs(collection(db, cardsPath));
        
        // 2. Seed data dynamically if deck is empty in Firestore
        if (cardsSnap.empty) {
          const deckData = DEMO_DECKS.find(d => d.id === deckId);
          const deckCards = DEMO_CARDS[deckId];
          
          if (deckData && deckCards) {
            // Seed Deck Info
            const deckRef = doc(db, 'decks', deckId);
            await setDoc(deckRef, deckData);
            
            // Seed Bundle of Cards
            const batch = writeBatch(db);
            deckCards.forEach((c) => {
              const newCardRef = doc(collection(db, cardsPath));
              batch.set(newCardRef, { ...c, deckId });
            });
            await batch.commit();
            
            // Re-fetch
            cardsSnap = await getDocs(collection(db, cardsPath));
          } else {
            // If it's a completely unknown deck, just navigate back
            console.error('Unknown deck id:', deckId);
            navigate('/learn');
            return;
          }
        }

        setCards(cardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Card)));
      } catch (error) {
        console.error('Session init error:', error);
        // Fail gracefully to allow demo flow
        const localCards = DEMO_CARDS[deckId] || [];
        setCards(localCards.map((c, i) => ({ ...c, id: `local-${i}`, deckId } as Card)));
        
        // Use the proper error handler for tracking, but don't block the UI if it's just a seeding fail
        try {
          handleFirestoreError(error, OperationType.GET, `decks/${deckId}/cards`);
        } catch (e) {
          // Logged
        }
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [deckId, navigate]);

  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    setIsSubmitted(true);
    
    const isMatch = userAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
    
    if (isMatch) {
      playSound('CORRECT');
      triggerSuccessConfetti();
    } else {
      playSound('WRONG');
    }

    // Auto-advance logic: Start 5 second countdown
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      // Time is up! judge based on match
      const isMatch = userAnswer.trim().toLowerCase() === currentCard.back.trim().toLowerCase();
      handleResponse(isMatch ? 2 : 0);
      setCountdown(null);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const handleResponse = async (feedback: 0 | 1 | 2) => {
    if (!profile || !cards[currentIndex]) return;
    
    // Clear any pending auto-advance timer if user clicks a button manually
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    
    const cardId = cards[currentIndex].id;
    const progressRef = doc(db, `userProgress/${profile.uid}/cards/${cardId}`);
    const progressSnap = await getDoc(progressRef);
    const existing = progressSnap.exists() ? (progressSnap.data() as CardProgress) : null;

    const nextState = calculateNextReview(
      existing ? { ...existing, nextReview: new Date(existing.nextReview) } : null,
      feedback
    );

    // Update Progress
    await setDoc(progressRef, {
      userId: profile.uid,
      cardId,
      deckId,
      ...nextState,
      nextReview: nextState.nextReview.toISOString(),
      lastReviewed: new Date().toISOString()
    });

    // Award XP
    let xpGain = 5;
    if (feedback === 2) {
      xpGain = 15;
      setCorrectCount(prev => prev + 1);
    } else if (feedback === 1) {
      xpGain = 10;
    }
    setSessionXP(prev => prev + xpGain);

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setIsSubmitted(false);
      setUserAnswer('');
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session End
      const finalCorrectCount = feedback === 2 ? correctCount + 1 : correctCount;
      await finalizeSession(sessionXP + xpGain, finalCorrectCount);
      setShowSummary(true);
    }
  };

  const finalizeSession = async (totalXp: number, finalCorrectCount: number) => {
    if (!profile) return;
    const userRef = doc(db, 'users', profile.uid);
    const newXP = profile.points + totalXp;
    const newDailyXP = (profile.dailyXP || 0) + totalXp;
    const newLevel = calculateLevel(newXP);
    const oldLevel = profile.level;
    const newStreak = calculateStreak(profile.lastActive, profile.streak || 0);
    
    // Add current deck to unlockedDecks if not already present
    const updatedUnlocked = Array.from(new Set([...(profile.unlockedDecks || []), deckId || '']));

    // Badge Logic
    const currentBadges = profile.badges || [];
    const newBadges = [...currentBadges];

    // Explorer badge: first session complete
    if (!newBadges.includes('Explorer')) {
      newBadges.push('Explorer');
    }

    // Scholar badge: Reach level 5
    if (newLevel >= 5 && !newBadges.includes('Scholar')) {
      newBadges.push('Scholar');
    }

    // Memory Master: 100% accuracy in a session with at least 5 cards
    const accuracy = finalCorrectCount / cards.length;
    if (accuracy === 1 && cards.length >= 5 && !newBadges.includes('Memory Master')) {
      newBadges.push('Memory Master');
    }

    if (newLevel > oldLevel) {
      setShowLevelUp(true);
      playSound('LEVEL_UP');
      triggerLevelUpConfetti();
    }
    
    await updateDoc(userRef, {
      points: newXP,
      dailyXP: newDailyXP,
      level: newLevel,
      streak: newStreak,
      lastActive: new Date().toISOString(),
      unlockedDecks: updatedUnlocked,
      badges: newBadges
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="animate-bounce">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-lg border-b-4 border-brand-primary/20">B</div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const nextLevel = calculateLevel(profile.points + sessionXP);
    const challengeType: ChallengeType = nextLevel === 2 ? 'breathing' : nextLevel === 3 ? 'sit-stand' : nextLevel === 4 ? 'observation' : 'pushups';

    return (
      <div className="relative">
        <AnimatePresence>
          {showLevelUp && (
            <PhysicalChallenge 
              type={challengeType}
              onComplete={() => setShowLevelUp(false)} 
            />
          )}
        </AnimatePresence>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center pt-20"
        >

        <div className="mb-8">
          <Trophy size={120} className="mx-auto text-brand-secondary mb-6" />
          <h2 className="text-4xl font-bold mb-2">Lesson Complete!</h2>
          <p className="text-xl text-[#777] mb-8">You've mastered more territory today.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-white border-2 border-[#e5e5e5] p-6 rounded-2xl">
            <div className="text-3xl font-black text-brand-secondary">+{sessionXP}</div>
            <div className="text-sm font-bold uppercase text-[#afafaf]">Total XP</div>
          </div>
          <div className="bg-white border-2 border-[#e5e5e5] p-6 rounded-2xl">
            <div className="text-3xl font-black text-brand-primary">{Math.round((correctCount / (cards.length || 1)) * 100)}%</div>
            <div className="text-sm font-bold uppercase text-[#afafaf]">Accuracy</div>
          </div>
        </div>

        <button onClick={() => navigate('/')} className="btn-primary w-full">
          CONTINUE
        </button>
      </motion.div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="max-w-3xl mx-auto min-h-screen flex flex-col pt-8 pb-12 px-4">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-4 md:mb-12 shrink-0">
        <button onClick={() => navigate('/')} className="text-[#afafaf] hover:text-[#4b4b4b]">
          <X size={32} />
        </button>
        <div className="flex-1 h-4 bg-[#e5e5e5] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-brand-primary transition-all shadow-[0_4px_0_0_rgba(70,163,2,1)]"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        {/* Flashcard */}
        <div 
          className="w-full max-w-lg aspect-[4/5] md:aspect-[3/4] card-flip shrink-0"
        >
          <div className={`card-flip-inner w-full h-full relative ${isFlipped ? 'is-flipped' : ''}`}>
            {/* Front */}
            <div className="card-front absolute w-full h-full bg-white border-2 border-[#e5e5e5] border-b-8 rounded-[2rem] flex flex-col items-center p-10 text-center shadow-sm overflow-hidden">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#afafaf] mb-4">Question</span>
              
              {currentCard?.imageUrl && (
                <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-[#f0f0f0]">
                  <img 
                    src={currentCard.imageUrl} 
                    alt="Question visual"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-auto">{currentCard?.front}</h3>
              
              <div className="w-full space-y-4 mt-4">
                {isSubmitted && !isFlipped && (
                  <div className="text-sm font-bold text-brand-accent uppercase tracking-widest animate-pulse">
                    Next question in {countdown}s...
                  </div>
                )}
                {!isSubmitted ? (
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text"
                      placeholder="Type your answer..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                      className="w-full bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl px-6 py-4 text-xl font-bold focus:border-brand-accent outline-none transition-all"
                      autoFocus
                    />
                    <button 
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim()}
                      className="btn-primary w-full disabled:opacity-50 disabled:grayscale"
                    >
                      SUBMIT
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsFlipped(true)}
                    className="w-full btn-secondary text-brand-accent border-brand-accent flex items-center justify-center gap-2 group"
                  >
                    <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    SHOW ANSWER
                  </button>
                )}
              </div>
            </div>
            
            {/* Back */}
            <div className="card-back absolute w-full h-full bg-[#ddf4ff] border-2 border-[#84d8ff] border-b-8 rounded-[2rem] flex flex-col items-center p-10 text-center shadow-sm">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#1cb0f6] mb-12">Correct Answer</span>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <h3 className="text-3xl md:text-5xl font-black text-[#1cb0f6] leading-tight">{currentCard?.back}</h3>
                {currentCard?.hint && (
                  <p className="mt-6 text-[#1cb0f6] bg-white/50 px-4 py-2 rounded-xl font-medium">{currentCard.hint}</p>
                )}
                <div className="mt-4 text-xs font-bold text-[#1cb0f6] uppercase tracking-[0.2em] animate-pulse">
                  Continuing in {countdown}s...
                </div>
              </div>

              <div className="w-full mt-auto">
                <div className={`p-4 rounded-2xl mb-4 font-bold text-lg ${
                  userAnswer.trim().toLowerCase() === currentCard?.back.trim().toLowerCase()
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'bg-brand-danger/10 text-brand-danger'
                }`}>
                  Your answer: {userAnswer || '(Empty)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="mt-12 flex gap-4 w-full max-w-lg"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleResponse(0); }}
                className="flex-1 h-16 bg-[#ff4b4b] border-b-4 border-[#d33131] hover:border-b-2 hover:translate-y-0.5 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                RETRY
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleResponse(1); }}
                className="flex-1 h-16 bg-[#ffc800] border-b-4 border-[#e5a000] hover:border-b-2 hover:translate-y-0.5 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                HARD
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleResponse(2); }}
                className="flex-1 h-16 bg-[#58cc02] border-b-4 border-[#46a302] hover:border-b-2 hover:translate-y-0.5 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
              >
                <Check size={20} />
                EASY
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Motivational Toast */}
      {!isFlipped && (
        <div className="mt-auto pb-8 text-center text-[#afafaf] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <HelpCircle size={18} />
          Can you recall it?
        </div>
      )}
    </div>
  );
}
