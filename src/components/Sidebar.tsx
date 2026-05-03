import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Settings,
  Flame,
  PlusCircle,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) {
  const { profile } = useAuth();

  const navItems = [
    { icon: Home, label: 'Learn', path: '/' },
    { icon: BookOpen, label: 'Courses', path: '/learn' },
    { icon: PlusCircle, label: 'Create', path: '/create' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r-2 border-[#e5e5e5] hidden md:flex flex-col p-4 transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl">
            B
          </div>
          {!isCollapsed && <h1 className="text-2xl font-bold text-brand-primary tracking-tight truncate">BrainBloom</h1>}
        </div>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded-lg text-[#afafaf] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : ''}
            className={({ isActive }) => 
              cn(
                "nav-item flex items-center gap-4 transition-all",
                isCollapsed ? "justify-center px-0" : "px-4",
                isActive && "nav-item-active"
              )
            }
          >
            <item.icon size={28} className="shrink-0" />
            {!isCollapsed && <span className="text-lg uppercase tracking-wide truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t-2 border-[#e5e5e5] pt-4 space-y-4">
        {profile && (
          <div className={`flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
             <div className={`w-8 h-8 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center text-white font-bold text-xs`}>
               {profile.displayName[0]}
             </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-lg truncate">{profile.displayName}</span>
                <div className="flex items-center gap-1 text-brand-primary font-bold text-xs truncate">
                  <Flame size={14} fill="currentColor" />
                  <span>{profile.streak} DAY STREAK</span>
                </div>
              </div>
            )}
          </div>
        )}
        <button 
          onClick={() => signOut(auth)}
          title={isCollapsed ? "Sign Out" : ""}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-3 text-[#afafaf] hover:text-brand-danger hover:bg-brand-danger/5 rounded-2xl transition-all font-bold uppercase tracking-widest text-sm",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut size={24} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
