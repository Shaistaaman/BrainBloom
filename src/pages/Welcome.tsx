import React from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../App';

export default function Welcome() {
  const { signIn } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-4xl mx-auto px-4 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-32 h-32 bg-brand-primary rounded-[2.5rem] flex items-center justify-center text-white text-6xl font-bold shadow-xl mb-8"
      >
        B
      </motion.div>
      
      <h1 className="text-5xl md:text-7xl font-bold text-brand-primary mb-6 tracking-tight">
        Master anything with BrainBloom
      </h1>
      
      <p className="text-xl md:text-2xl text-[#777] mb-12 max-w-2xl font-medium leading-relaxed">
        Unlock the power of active recall and spaced repetition in a vibrant, gamified world.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={signIn}
          className="btn-primary flex items-center justify-center gap-3 text-xl py-4"
        >
          <LogIn size={24} />
          GET STARTED
        </button>
        <p className="text-sm font-bold text-[#afafaf] uppercase tracking-widest mt-4">
          Free Forever • Scientist Approved
        </p>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { color: 'text-brand-accent', label: 'Spaced Repetition', desc: 'Retain knowledge efficiently with smart scheduling.' },
          { color: 'text-brand-secondary', label: 'Active Recall', desc: 'Strengthen neural pathways by testing yourself.' },
          { color: 'text-brand-purple', label: 'Gamified Growth', desc: 'Level up, earn badges, and climb leaderboards.' }
        ].map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex flex-col items-center"
          >
            <h3 className={`text-xl font-bold mb-2 uppercase tracking-wide ${feat.color}`}>{feat.label}</h3>
            <p className="text-[#777] font-medium leading-tight">{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
