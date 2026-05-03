import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, MapPin, Camera, Image as ImageIcon } from 'lucide-react';

export default function AddPropertyStep1() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <header className="flex items-center p-4 justify-between sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300 p-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Add New Property</h1>
        <button className="text-primary font-bold text-sm">Cancel</button>
      </header>

      <div className="flex w-full flex-row items-center justify-center gap-3 py-6">
        <div className="h-2 w-8 rounded-full bg-primary"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
      </div>

      <main className="px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight mb-1">Basic Information</h2>
          <p className="text-sm text-slate-500">Step 1 of 4: Enter general details about your property</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Property Title</label>
            <input 
              type="text" 
              placeholder="e.g. Modern 3-Bedroom Apartment in Gulshan" 
              className="w-full h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
            <div className="relative">
              <select className="w-full h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 appearance-none focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="">Select property type</option>
                <option value="flat">Flat / Apartment</option>
                <option value="sublet">Sublet</option>
                <option value="room">Room</option>
                <option value="mess">Mess</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Monthly Rent (BDT)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 font-bold">
                ৳
              </div>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full h-14 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location / Address</label>
            <div className="relative">
              <div className="absolute top-4 left-4 text-slate-400">
                <MapPin size={20} />
              </div>
              <textarea 
                placeholder="House No, Road Name, Area, City" 
                className="w-full h-24 pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Property Photos</label>
            <div className="grid grid-cols-3 gap-3">
              <button className="aspect-square rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors">
                <Camera size={24} />
                <span className="text-[10px] font-bold">Add Main</span>
              </button>
              <div className="aspect-square rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <ImageIcon size={24} />
              </div>
              <div className="aspect-square rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <ImageIcon size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Upload at least 3 high-quality photos (JPG or PNG, max 5MB each)</p>
          </div>

          <div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden mb-8">
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                <MapPin size={16} />
                Open Map to Pin
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 z-50">
        <Link to="/add-property/2" className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20">
          Next Step
          <ArrowLeft size={20} className="rotate-180" />
        </Link>
      </div>
    </div>
  );
}
