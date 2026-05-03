import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, writeBatch, doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, Info, AlertCircle, CheckCircle2, ArrowLeft, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface NewCard {
  id?: string;
  front: string;
  back: string;
  imageUrl?: string;
}

export default function CreateCourse() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(1);
  const [useImages, setUseImages] = useState(false);
  const [cards, setCards] = useState<NewCard[]>([{ front: '', back: '', imageUrl: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [error, setError] = useState('');
  const [userCourseCount, setUserCourseCount] = useState(0);
  const [imageLoadStatus, setImageLoadStatus] = useState<{ [key: string]: 'loading' | 'loaded' | 'error' }>({});

  useEffect(() => {
    if (!profile) return;
    async function fetchData() {
      try {
        // Handle pre-selected level from query param
        const levelParam = searchParams.get('level');
        if (levelParam) {
          const parsedLevel = parseInt(levelParam);
          if (!isNaN(parsedLevel) && parsedLevel >= 1 && parsedLevel <= 10) {
            setLevel(parsedLevel);
          }
        }

        // Check limits if NOT editing
        if (!editId) {
          const q = query(collection(db, 'decks'), where('ownerId', '==', profile.uid));
          const snap = await getDocs(q);
          setUserCourseCount(snap.size);
        }

        // Load data if editing
        if (editId) {
          const deckRef = doc(db, 'decks', editId);
          const deckSnap = await getDoc(deckRef);
          
          if (!deckSnap.exists()) {
            setError('Course not found.');
            return;
          }

          const deckData = deckSnap.data();
          if (deckData.ownerId !== profile.uid) {
            setError('You do not have permission to edit this course.');
            return;
          }

          setTitle(deckData.title);
          setDescription(deckData.description);
          setLevel(deckData.minLevel);
          
          const cardsSnap = await getDocs(collection(db, `decks/${editId}/cards`));
          const loadedCards = cardsSnap.docs.map(d => ({ 
            id: d.id, 
            ...d.data() 
          } as NewCard));
          
          setCards(loadedCards.length > 0 ? loadedCards : [{ front: '', back: '', imageUrl: '' }]);
          setUseImages(loadedCards.some(c => c.imageUrl));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load course data.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [profile, editId]);

  const addCard = () => {
    if (cards.length >= 10) return;
    setCards([...cards, { front: '', back: '', imageUrl: '' }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: keyof NewCard, value: string) => {
    const newCards = [...cards];
    (newCards[index] as any)[field] = value;
    
    if (field === 'imageUrl') {
      if (value) {
        setImageLoadStatus(prev => ({ ...prev, [index]: 'loading' }));
      } else {
        setImageLoadStatus(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      }
    }
    
    setCards(newCards);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!editId && userCourseCount >= 5) {
      setError('You have reached the limit of 5 personal courses.');
      return;
    }
    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }
    if (cards.some(c => !c.front.trim() || !c.back.trim())) {
      setError('All cards must have a front and back.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let deckId = editId;
      
      if (editId) {
        // Update existing deck
        await setDoc(doc(db, 'decks', editId), {
          title: title.trim(),
          description: description.trim(),
          icon: useImages ? '🖼️' : '📝',
          color: useImages ? '#1cb0f6' : '#ce82ff',
          category: 'Personal',
          difficulty: level,
          minLevel: level,
          ownerId: profile.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // Create new deck
        const deckRef = await addDoc(collection(db, 'decks'), {
          title: title.trim(),
          description: description.trim(),
          icon: useImages ? '🖼️' : '📝',
          color: useImages ? '#1cb0f6' : '#ce82ff',
          category: 'Personal',
          difficulty: level,
          minLevel: level,
          ownerId: profile.uid,
          createdAt: new Date().toISOString()
        });
        deckId = deckRef.id;
      }

      const batch = writeBatch(db);
      
      // If editing, we need to handle deleted cards too
      // For simplicity, let's delete old cards and recreate them or update existing ones
      // Better approach: If they have IDs, update. If not, create.
      // But we also need to find cards that were removed from the UI.
      if (editId) {
        const existingCardsSnap = await getDocs(collection(db, `decks/${editId}/cards`));
        existingCardsSnap.docs.forEach(d => {
          const stillExists = cards.find(c => c.id === d.id);
          if (!stillExists) {
            batch.delete(d.ref);
          }
        });
      }

      cards.forEach((card) => {
        const cardRef = card.id 
          ? doc(db, `decks/${deckId}/cards`, card.id)
          : doc(collection(db, `decks/${deckId}/cards`));
          
        batch.set(cardRef, {
          front: card.front,
          back: card.back,
          imageUrl: useImages ? card.imageUrl : null,
          deckId: deckId,
          ownerId: profile.uid
        }, { merge: true });
      });

      await batch.commit();

      // Badge logic: Visionary (Create 3 courses)
      if (!editId && userCourseCount >= 2 && !profile.badges?.includes('Visionary')) {
        const userRef = doc(db, 'users', profile.uid);
        const updatedBadges = [...(profile.badges || []), 'Visionary'];
        await updateDoc(userRef, { badges: updatedBadges });
      }

      navigate('/learn');
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center font-bold text-brand-primary animate-pulse uppercase tracking-[0.3em]">
        Loading Course...
      </div>
    );
  }

  if (!editId && userCourseCount >= 5) {
    return (
      <div className="max-w-4xl mx-auto pt-20 text-center">
        <div className="bg-white p-12 rounded-[3rem] border-2 border-[#e5e5e5] shadow-sm">
          <AlertCircle size={80} className="text-brand-danger mx-auto mb-6" />
          <h2 className="text-4xl font-black mb-4 uppercase">Limit Reached</h2>
          <p className="text-[#777] font-bold text-lg mb-8 uppercase tracking-widest">
            You can create up to 5 courses. You already have {userCourseCount}.
          </p>
          <button onClick={() => navigate('/learn')} className="btn-primary">
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">
            {editId ? 'Edit Course' : 'Create Course'}
          </h1>
          <p className="text-[#777] font-bold uppercase tracking-widest text-sm flex items-center gap-2">
            <Info size={16} />
            Maximum 5 courses per user • 10 cards per course
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-brand-primary uppercase tracking-widest">
            Course {userCourseCount + 1}/5
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Course Info */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#e5e5e5] shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#afafaf] tracking-widest ml-1">Course Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Biology Notes"
              className="w-full bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl px-6 py-4 text-xl font-bold focus:border-brand-accent outline-none transition-all"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#afafaf] tracking-widest ml-1">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this course about?"
              className="w-full bg-[#f7f7f7] border-2 border-[#e5e5e5] rounded-2xl px-6 py-4 font-bold focus:border-brand-accent outline-none transition-all h-32 resize-none"
              maxLength={200}
            />
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase text-[#afafaf] tracking-widest ml-1">Course Level</label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${
                    level === lvl 
                      ? 'bg-brand-accent text-white border-brand-accent shadow-[0_4px_0_0_#1296d2]' 
                      : 'bg-[#f7f7f7] text-[#afafaf] border-[#e5e5e5] hover:border-brand-accent/50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-[#afafaf] tracking-widest ml-1">Question Format</label>
              <div className="flex gap-4 p-2 bg-[#f7f7f7] rounded-3xl border-2 border-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => setUseImages(false)}
                  className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs transition-all ${!useImages ? 'bg-white shadow-sm text-brand-primary' : 'text-[#afafaf]'}`}
                >
                  Text Only
                </button>
                <button
                  type="button"
                  onClick={() => setUseImages(true)}
                  className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs transition-all ${useImages ? 'bg-white shadow-sm text-brand-primary' : 'text-[#afafaf]'}`}
                >
                  Text + Image
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Flashcards ({cards.length}/10)</h2>
            <button 
              type="button" 
              onClick={addCard}
              disabled={cards.length >= 10}
              className="flex items-center gap-2 text-brand-accent font-black uppercase text-sm hover:opacity-80 disabled:opacity-30 transition-all"
            >
              <Plus size={20} /> Add Card
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border-2 border-[#e5e5e5] shadow-sm flex flex-col md:flex-row gap-6 relative group"
              >
                <div className="flex-[2] space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#afafaf] tracking-widest">Question (Text)</label>
                  <input 
                    type="text"
                    value={card.front}
                    onChange={(e) => updateCard(index, 'front', e.target.value)}
                    placeholder="e.g., What is photosynthesis?"
                    className="w-full bg-[#f7f7f7] border-2 border-transparent rounded-xl px-4 py-2 font-bold focus:border-brand-accent outline-none transition-all"
                  />
                  {useImages && (
                    <div className="mt-2 flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase text-[#afafaf] tracking-widest flex items-center justify-between">
                          <span>Question (Image Source)</span>
                          <span className="text-brand-accent">URL or Upload</span>
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            value={card.imageUrl}
                            onChange={(e) => updateCard(index, 'imageUrl', e.target.value)}
                            placeholder="https://images.pexels.com/photos/..."
                            className="flex-1 bg-[#f7f7f7] border-2 border-transparent rounded-xl px-4 py-2 font-bold focus:border-brand-accent outline-none transition-all text-xs"
                          />
                          <label className="cursor-pointer bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary p-2 rounded-xl transition-all flex items-center justify-center">
                            <Camera size={18} />
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Max 2MB for base64 strings to stay within Firestore limits (roughly)
                                  if (file.size > 2 * 1024 * 1024) {
                                    setError('Image size must be less than 2MB');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  setImageLoadStatus(prev => ({ ...prev, [index]: 'loading' }));
                                  reader.onload = (event) => {
                                    updateCard(index, 'imageUrl', event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f0f0f0] border-2 border-[#e5e5e5] flex-shrink-0 relative group/preview">
                        {card.imageUrl ? (
                          <>
                            <img 
                              id={`preview-${index}`}
                              src={card.imageUrl} 
                              alt="Preview" 
                              className={`w-full h-full object-cover transition-all duration-300 group-hover/preview:scale-110 ${
                                imageLoadStatus[index] === 'loaded' ? 'opacity-100' : 'opacity-0'
                              }`}
                              referrerPolicy="no-referrer"
                              onLoad={() => setImageLoadStatus(prev => ({ ...prev, [index]: 'loaded' }))}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Invalid+Image';
                                setImageLoadStatus(prev => ({ ...prev, [index]: 'error' }));
                              }}
                            />
                            {imageLoadStatus[index] === 'loading' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0]">
                                <Loader2 size={20} className="text-brand-primary animate-spin" />
                              </div>
                            )}
                            {imageLoadStatus[index] === 'error' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-brand-danger/10">
                                <AlertCircle size={20} className="text-brand-danger" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                             <ImageIcon size={24} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#afafaf] tracking-widest">Answer</label>
                  <input 
                    type="text"
                    value={card.back}
                    onChange={(e) => updateCard(index, 'back', e.target.value)}
                    placeholder="e.g., Use of light..."
                    className="w-full bg-[#f7f7f7] border-2 border-transparent rounded-xl px-4 py-2 font-bold focus:border-brand-accent outline-none transition-all"
                  />
                </div>
                {cards.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeCard(index)}
                    className="absolute -right-3 -top-3 w-8 h-8 bg-white border-2 border-brand-danger rounded-full flex items-center justify-center text-brand-danger shadow-md hover:bg-brand-danger hover:text-white transition-all scale-0 group-hover:scale-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {error && (
          <div className="bg-brand-danger/10 text-brand-danger p-4 rounded-2xl font-bold flex items-center gap-3">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-3 py-6 text-xl"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={24} />
          )}
          {isSubmitting ? 'SAVING...' : editId ? 'UPDATE COURSE' : 'PUBLISH COURSE'}
        </button>
      </form>
    </div>
  );
}
