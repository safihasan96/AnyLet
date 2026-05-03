import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, User, Search, SlidersHorizontal, Building2, Users, Bed, DoorOpen, Star, Heart } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function Home() {
  return (
    <div className="pb-24">
      <header className="flex items-center bg-background-light dark:bg-background-dark p-4 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary" size={28} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Location</p>
            <div className="flex items-center gap-1">
              <h2 className="text-slate-900 dark:text-slate-100 text-sm font-bold leading-tight">Dhaka, Bangladesh</h2>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell size={20} />
          </button>
          <button className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User size={20} />
          </button>
        </div>
      </header>

      <div className="px-4 py-2">
        <label className="flex flex-col w-full">
          <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-slate-400 flex items-center justify-center pl-4">
              <Search size={20} />
            </div>
            <input 
              className="flex w-full border-none bg-transparent focus:ring-0 text-base font-normal placeholder:text-slate-400 px-3 outline-none" 
              placeholder="Search area, house type..." 
            />
            <div className="flex items-center pr-2">
              <Link to="/filters" className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                <SlidersHorizontal size={20} />
              </Link>
            </div>
          </div>
        </label>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="font-bold text-lg">Categories</h3>
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto no-scrollbar pb-2">
          <div className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Building2 size={28} />
            </div>
            <p className="text-xs font-semibold">Flat</p>
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
              <Users size={28} />
            </div>
            <p className="text-xs font-semibold">Sublet</p>
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
              <Bed size={28} />
            </div>
            <p className="text-xs font-semibold">Room</p>
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 shadow-sm">
              <DoorOpen size={28} />
            </div>
            <p className="text-xs font-semibold">Mess</p>
          </div>
        </div>
      </div>

      <div className="mt-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Featured Listings</h3>
          <Link to="#" className="text-primary text-sm font-bold">See All</Link>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Link to="/property/1" className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="relative h-48 w-full">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80" alt="Modern luxury apartment" />
              <div className="absolute top-3 right-3">
                <button className="size-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-900">
                  <Heart size={18} />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-primary text-white px-3 py-1 rounded-lg font-bold text-sm">
                ৳ 25,000/mo
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-lg">Modern 3BHK Flat</h4>
                <div className="flex items-center text-amber-500">
                  <Star size={14} className="fill-current" />
                  <span className="text-xs font-bold ml-1">4.8</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-3">
                <MapPin size={14} />
                <span>Road 12, Dhanmondi, Dhaka</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Bed size={16} />
                    <span className="text-xs">3 Bed</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <DoorOpen size={16} />
                    <span className="text-xs">2 Bath</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Building2 size={16} />
                    <span className="text-xs">1450 sqft</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/property/2" className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="relative h-48 w-full">
              <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80" alt="Cozy apartment" />
              <div className="absolute top-3 right-3">
                <button className="size-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-900">
                  <Heart size={18} />
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-primary text-white px-3 py-1 rounded-lg font-bold text-sm">
                ৳ 18,500/mo
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-lg">Cozy Family Sublet</h4>
                <div className="flex items-center text-amber-500">
                  <Star size={14} className="fill-current" />
                  <span className="text-xs font-bold ml-1">4.5</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-3">
                <MapPin size={14} />
                <span>Banani Block C, Dhaka</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700 pt-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Bed size={16} />
                    <span className="text-xs">2 Bed</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <DoorOpen size={16} />
                    <span className="text-xs">1 Bath</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <Building2 size={16} />
                    <span className="text-xs">1100 sqft</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
