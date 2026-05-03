import { Link, useLocation } from 'react-router-dom';
import { Compass, Heart, Plus, MessageSquare, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-6 pb-6 pt-3 flex justify-between items-center z-50">
      <Link to="/" className={`flex flex-col items-center gap-1 ${path === '/' ? 'text-primary' : 'text-slate-400'}`}>
        <Compass className={path === '/' ? 'fill-current' : ''} size={24} />
        <span className="text-[10px] font-bold">Explore</span>
      </Link>
      <Link to="/saved" className={`flex flex-col items-center gap-1 ${path === '/saved' ? 'text-primary' : 'text-slate-400'}`}>
        <Heart className={path === '/saved' ? 'fill-current' : ''} size={24} />
        <span className="text-[10px] font-bold">Saved</span>
      </Link>
      <div className="relative -top-8">
        <Link to="/add-property/1" className="bg-primary text-white size-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background-light dark:border-background-dark">
          <Plus size={32} />
        </Link>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">List</span>
      </div>
      <Link to="/messages" className={`flex flex-col items-center gap-1 ${path === '/messages' ? 'text-primary' : 'text-slate-400'}`}>
        <MessageSquare className={path === '/messages' ? 'fill-current' : ''} size={24} />
        <span className="text-[10px] font-bold">Messages</span>
      </Link>
      <Link to="/dashboard" className={`flex flex-col items-center gap-1 ${path === '/dashboard' ? 'text-primary' : 'text-slate-400'}`}>
        <User className={path === '/dashboard' ? 'fill-current' : ''} size={24} />
        <span className="text-[10px] font-bold">Profile</span>
      </Link>
    </nav>
  );
}
