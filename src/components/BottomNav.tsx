import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  PlusCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Learn', path: '/' },
    { icon: BookOpen, label: 'Courses', path: '/learn' },
    { icon: PlusCircle, label: 'Create', path: '/create' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#e5e5e5] px-2 py-1 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            cn(
              "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all",
              isActive ? "text-brand-accent scale-110" : "text-[#afafaf]"
            )
          }
        >
          <item.icon size={24} fill={item.path === window.location.pathname ? "currentColor" : "none"} />
          <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
