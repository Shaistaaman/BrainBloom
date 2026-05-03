import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useLocation
} from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, signIn } from './lib/firebase';
import { calculateLevel, calculateStreak } from './lib/srs';
import { LogOut } from 'lucide-react';

// Types
import { UserProfile } from './types/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Components
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Session from './pages/Session';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import CreateCourse from './pages/CreateCourse';
import Welcome from './pages/Welcome';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        const userRef = doc(db, 'users', u.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          const today = new Date().toISOString().split('T')[0];
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'New Learner',
            photoURL: u.photoURL || '',
            points: 0,
            level: 1,
            streak: 0,
            lastActive: new Date().toISOString(),
            dailyXP: 0,
            lastGoalReset: today,
            badges: [],
            unlockedDecks: ['initial-deck']
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          const profileData = snap.data() as UserProfile;
          
          // Migration: Ensure new fields exist
          if (profileData.dailyXP === undefined || !profileData.lastGoalReset) {
            const today = new Date().toISOString().split('T')[0];
            await updateDoc(userRef, {
              dailyXP: profileData.dailyXP ?? 0,
              lastGoalReset: profileData.lastGoalReset ?? today
            });
            profileData.dailyXP = profileData.dailyXP ?? 0;
            profileData.lastGoalReset = profileData.lastGoalReset ?? today;
          }

          // Check if streak is broken
          const now = new Date();
          const lastActive = new Date(profileData.lastActive);
          const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
          const diffInDays = Math.floor((nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffInDays > 1 && profileData.streak > 0) {
            await updateDoc(userRef, { streak: 0 });
            profileData.streak = 0;
          }

          setProfile(profileData);
          // Sync profile updates (points, levels)
          onSnapshot(userRef, (doc) => {
            setProfile(doc.data() as UserProfile);
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="animate-bounce">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-lg border-b-4 border-brand-primary/20">B</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn }}>
      <Router>
        <div className="min-h-screen bg-[#f7f7f7] flex flex-col md:flex-row relative overflow-x-hidden">
          {user && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />}
          {user && <BottomNav />}
          
          <main className={`flex-1 w-full min-h-screen transition-all duration-300 ${user ? (isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''} pb-24 md:pb-8 overflow-x-auto`}>
            {user && (
              <header className="md:hidden sticky top-0 z-40 bg-white border-b-2 border-[#e5e5e5] px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">B</div>
                  <span className="font-black text-brand-primary uppercase tracking-tight">BrainBloom</span>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 text-[#afafaf] hover:text-brand-danger transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={22} />
                </button>
              </header>
            )}
            
            <div className="p-4 md:p-8 w-full max-w-full">
              <Routes>
                <Route path="/" element={user ? <Home /> : <Welcome />} />
                <Route path="/learn" element={user ? <Learn /> : <Navigate to="/" />} />
                <Route path="/session/:deckId" element={user ? <Session /> : <Navigate to="/" />} />
                <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/" />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
                <Route path="/create" element={user ? <CreateCourse /> : <Navigate to="/" />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
