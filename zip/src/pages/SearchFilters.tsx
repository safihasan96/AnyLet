import { Link, useNavigate } from 'react-router-dom';
import { X, Search, Check, ArrowRight } from 'lucide-react';

export default function SearchFilters() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
        <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold">Search Filters</h1>
        <button className="text-primary font-semibold text-sm px-2 py-1 hover:bg-primary/10 rounded-lg">Reset</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <section className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Location</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={20} />
            </div>
            <input 
              className="block w-full pl-10 pr-3 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
              placeholder="Area or Landmark (e.g. Dhanmondi, Gulshan)" 
              type="text" 
            />
          </div>
        </section>

        <section className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Price Range (BDT)</h2>
          </div>
          <div className="px-2">
            <div className="relative h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-8">
              <div className="absolute h-1 bg-primary left-[10%] right-[30%] rounded-full"></div>
              <div className="absolute -top-2 left-[10%] w-5 h-5 bg-primary border-4 border-white dark:border-slate-900 rounded-full shadow-lg cursor-pointer"></div>
              <div className="absolute -top-2 right-[30%] w-5 h-5 bg-primary border-4 border-white dark:border-slate-900 rounded-full shadow-lg cursor-pointer"></div>
              <div className="absolute top-6 left-[10%] -translate-x-1/2 text-xs font-bold text-slate-900 dark:text-slate-100">5,000</div>
              <div className="absolute top-6 right-[30%] translate-x-1/2 text-xs font-bold text-slate-900 dark:text-slate-100">100,000+</div>
            </div>
          </div>
        </section>

        <section className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Bedrooms</h2>
          <div className="flex gap-3">
            <button className="flex-1 py-3 px-1 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-medium hover:border-primary hover:text-primary transition-colors">1</button>
            <button className="flex-1 py-3 px-1 bg-primary text-white border border-primary rounded-xl text-center font-medium">2</button>
            <button className="flex-1 py-3 px-1 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-medium hover:border-primary hover:text-primary transition-colors">3</button>
            <button className="flex-1 py-3 px-1 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-medium hover:border-primary hover:text-primary transition-colors">4+</button>
          </div>
        </section>

        <section className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Tenant Preference</h2>
          <div className="flex flex-wrap gap-2">
            <label className="flex-1 min-w-[100px] cursor-pointer">
              <input type="radio" name="tenant" className="hidden peer" defaultChecked />
              <div className="py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-medium peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                Family
              </div>
            </label>
            <label className="flex-1 min-w-[100px] cursor-pointer">
              <input type="radio" name="tenant" className="hidden peer" />
              <div className="py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-medium peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                Bachelor
              </div>
            </label>
            <label className="flex-1 min-w-[100px] cursor-pointer">
              <input type="radio" name="tenant" className="hidden peer" />
              <div className="py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm font-medium peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                Female Only
              </div>
            </label>
          </div>
        </section>

        <section className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Amenities</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary transition-colors">
                <Check size={16} className="text-white hidden" />
              </div>
              <input type="checkbox" className="hidden peer" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Elevator / Lift</span>
            </label>
            <label className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-6 h-6 rounded border-2 border-primary bg-primary flex items-center justify-center">
                <Check size={16} className="text-white" />
              </div>
              <input type="checkbox" className="hidden peer" defaultChecked />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Generator Backup</span>
            </label>
            <label className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary transition-colors">
                <Check size={16} className="text-white hidden" />
              </div>
              <input type="checkbox" className="hidden peer" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">CCTV Security</span>
            </label>
            <label className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary transition-colors">
                <Check size={16} className="text-white hidden" />
              </div>
              <input type="checkbox" className="hidden peer" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Parking Slot</span>
            </label>
            <label className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary transition-colors">
                <Check size={16} className="text-white hidden" />
              </div>
              <input type="checkbox" className="hidden peer" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Balcony</span>
            </label>
            <label className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-primary transition-colors">
                <Check size={16} className="text-white hidden" />
              </div>
              <input type="checkbox" className="hidden peer" />
              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Gas Connection</span>
            </label>
          </div>
        </section>
      </main>

      <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
        <button onClick={() => navigate(-1)} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
          Show 142 Results
          <ArrowRight size={20} />
        </button>
      </footer>
    </div>
  );
}
