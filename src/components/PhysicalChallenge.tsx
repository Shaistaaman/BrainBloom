import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, CheckCircle2, ArrowUp, ArrowDown, Dumbbell, EyeOff } from 'lucide-react';
import { playSound } from '../lib/effects';

export type ChallengeType = 'breathing' | 'sit-stand' | 'pushups' | 'observation';

interface PhysicalChallengeProps {
  type: ChallengeType;
  onComplete: () => void;
  isOverlay?: boolean;
}

export default function PhysicalChallenge({ type, onComplete, isOverlay = true }: PhysicalChallengeProps) {
  const [phase, setPhase] = useState<'action' | 'complete'>('action');
  const [counter, setCounter] = useState(type === 'sit-stand' || type === 'pushups' ? 3 : 5);
  const [subPhase, setSubPhase] = useState<'up' | 'down' | 'inhale' | 'exhale' | 'look'>('inhale');

  useEffect(() => {
    if (phase === 'complete') return;

    const timer = setInterval(() => {
      if (type === 'breathing') {
        setCounter((prev) => {
          if (prev <= 1) {
            if (subPhase === 'inhale') {
              setSubPhase('exhale');
              return 5;
            } else {
              setPhase('complete');
              playSound('LEVEL_UP');
              setTimeout(onComplete, 2000);
              return 0;
            }
          }
          return prev - 1;
        });
      } else if (type === 'observation') {
        setCounter((prev) => {
          if (prev <= 1) {
            setPhase('complete');
            playSound('LEVEL_UP');
            setTimeout(onComplete, 2000);
            return 0;
          }
          return prev - 1;
        });
      } else {
        // Sit-stand or Pushups: Toggle subphases based on rhythm
        setSubPhase(prev => (prev === 'up' ? 'down' : 'up'));
      }
    }, (type === 'breathing' || type === 'observation') ? 1000 : 1500);

    return () => clearInterval(timer);
  }, [phase, subPhase, type, onComplete]);

  // Logic for movement-based exercises
  useEffect(() => {
    if (type === 'breathing' || type === 'observation' || phase === 'complete') return;
    
    if (subPhase === 'up') {
      setCounter(prev => {
        if (prev <= 1) {
          setPhase('complete');
          playSound('LEVEL_UP');
          setTimeout(onComplete, 2000);
          return 0;
        }
        return prev - 1;
      });
    }
  }, [subPhase]);

  const content = (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl ${!isOverlay ? 'border-4 border-brand-accent' : ''}`}
    >
      <AnimatePresence mode="wait">
        {phase !== 'complete' ? (
          <motion.div 
            key={type + subPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="relative flex items-center justify-center">
              <motion.div 
                animate={{ 
                  scale: (subPhase === 'inhale' || subPhase === 'up') ? [1, 1.4] : [1.4, 1],
                  rotate: type === 'breathing' ? 0 : (subPhase === 'up' ? 0 : 180)
                }}
                transition={{ duration: type === 'breathing' ? 5 : 0.8, ease: "easeInOut" }}
                className="w-32 h-32 bg-brand-accent/10 rounded-full absolute"
              />
              {type === 'breathing' && <Wind size={64} className="text-brand-accent relative z-10" />}
              {type === 'sit-stand' && (subPhase === 'up' ? <ArrowUp size={64} className="text-brand-accent relative z-10" /> : <ArrowDown size={64} className="text-brand-accent relative z-10" />)}
              {type === 'pushups' && <Dumbbell size={64} className="text-brand-accent relative z-10" />}
              {type === 'observation' && <EyeOff size={64} className="text-brand-accent relative z-10" />}
            </div>

            <h2 className="text-4xl font-black text-brand-accent uppercase tracking-tighter">
              {type === 'breathing' ? (subPhase === 'inhale' ? 'Inhale' : 'Exhale') : 
               type === 'sit-stand' ? (subPhase === 'up' ? 'Stand Up!' : 'Sit Down') :
               type === 'pushups' ? (subPhase === 'up' ? 'Push Up!' : 'Go Down') :
               'Look Off-Screen'}
            </h2>
            
            <div className="text-7xl font-black text-[#e5e5e5]">
              {counter}
            </div>

            <p className="text-[#777] font-bold uppercase tracking-widest text-sm">
              {type === 'breathing' ? 'Center your energy' : 
               type === 'observation' ? 'Observe something far away for 5s' : 
               `Finish ${counter} more reps`}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <CheckCircle2 size={100} className="text-brand-primary mx-auto" />
            <h2 className="text-4xl font-black text-brand-primary uppercase">Victory!</h2>
            <p className="text-xl text-[#777] font-medium italic">Your body is energized, your mind is sharp.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-[100] bg-brand-accent/90 backdrop-blur-md flex items-center justify-center p-6">
        {content}
      </div>
    );
  }

  return content;
}
