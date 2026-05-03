import { Link } from 'react-router-dom';
import { Bell, User, Wallet, PieChart, Building2, Clock, Plus, BarChart2, FileText, ArrowRight, RefreshCw, MessageSquare, Users } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function LandlordDashboard() {
  return (
    <div className="pb-24 bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-slate-900 p-4 justify-between sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">Landlord Hub</h1>
            <p className="text-xs text-slate-500">Dhaka, Bangladesh</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button className="relative text-slate-600 dark:text-slate-400">
            <Bell size={24} />
            <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" alt="Profile" className="size-10 rounded-full object-cover border-2 border-primary/20" />
        </div>
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="col-span-1 bg-primary text-white rounded-2xl p-5 shadow-lg shadow-primary/20 flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <span className="text-sm font-medium text-white/80">Total Earnings</span>
            <Wallet size={18} className="text-white/60" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">৳450,000</h2>
            <div className="flex items-center gap-1 text-xs font-medium text-green-300">
              <ArrowRight size={12} className="-rotate-45" />
              +12.5%
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 size-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500">Occupancy</span>
            <PieChart size={18} className="text-slate-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black mb-1 text-slate-900 dark:text-slate-100">85%</h2>
            <div className="flex items-center gap-1 text-xs font-medium text-green-500">
              <ArrowRight size={12} className="-rotate-45" />
              +5%
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-36">
          <div className="size-10 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center mb-3">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Active Listings</h3>
            <p className="text-xs text-slate-500 mt-1">12 Properties</p>
          </div>
        </div>

        <div className="col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-36">
          <div className="size-10 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-xl flex items-center justify-center mb-3">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Pending</h3>
            <p className="text-xs text-slate-500 mt-1">4 Applications</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-2">
        <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/add-property/1" className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-slate-100 dark:border-slate-700 aspect-square">
            <div className="size-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Add New<br/>Property</span>
          </Link>
          <button className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-slate-100 dark:border-slate-700 aspect-square">
            <div className="size-12 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center">
              <BarChart2 size={24} />
            </div>
            <span className="text-xs font-bold text-center leading-tight">View<br/>Analytics</span>
          </button>
          <button className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-slate-100 dark:border-slate-700 aspect-square">
            <div className="size-12 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center">
              <FileText size={24} />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Tax<br/>Reports</span>
          </button>
        </div>
      </div>

      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Recent Activities</h3>
          <button className="text-primary text-sm font-bold">View All</button>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="size-12 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">Payment Received</h4>
              <p className="text-xs text-slate-500 truncate">৳35,000 from Rahat (Flat 4B)</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">2m ago</span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <MessageSquare size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">New Message</h4>
              <p className="text-xs text-slate-500 truncate">"When is the water tank cleaning?"</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">45m ago</span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="size-12 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">New Application</h4>
              <p className="text-xs text-slate-500 truncate">Saima Akter applied for Banani Villa</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">2h ago</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
