import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Minus } from 'lucide-react';

export default function AddPropertyStep2() {
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
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-8 rounded-full bg-primary"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
      </div>

      <main className="px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight mb-1">Details & Amenities</h2>
          <p className="text-sm text-slate-500">Step 2 of 4: Specify rooms and features</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Rooms & Spaces</label>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-medium">Bedrooms</span>
                <div className="flex items-center gap-4">
                  <button className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg w-4 text-center">3</span>
                  <button className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-medium">Bathrooms</span>
                <div className="flex items-center gap-4">
                  <button className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg w-4 text-center">2</span>
                  <button className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-medium">Balconies</span>
                <div className="flex items-center gap-4">
                  <button className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg w-4 text-center">2</span>
                  <button className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Property Size (SqFt)</label>
            <input 
              type="number" 
              placeholder="e.g. 1450" 
              className="w-full h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Select Amenities</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-primary bg-primary/5 cursor-pointer">
                <div className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
                <input type="checkbox" className="hidden peer" defaultChecked />
                <span className="text-slate-900 dark:text-slate-100 text-sm font-medium">Lift / Elevator</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-primary bg-primary/5 cursor-pointer">
                <div className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
                <input type="checkbox" className="hidden peer" defaultChecked />
                <span className="text-slate-900 dark:text-slate-100 text-sm font-medium">Generator</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Check size={14} className="text-white hidden" />
                </div>
                <input type="checkbox" className="hidden peer" />
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Line Gas</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Check size={14} className="text-white hidden" />
                </div>
                <input type="checkbox" className="hidden peer" />
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">CCTV Security</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Check size={14} className="text-white hidden" />
                </div>
                <input type="checkbox" className="hidden peer" />
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">Car Parking</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
                <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <Check size={14} className="text-white hidden" />
                </div>
                <input type="checkbox" className="hidden peer" />
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">WASA Water</span>
              </label>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 z-50 flex gap-3">
        <button onClick={() => navigate(-1)} className="w-1/3 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl">
          Back
        </button>
        <Link to="/review" className="w-2/3 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20">
          Next Step
          <ArrowLeft size={20} className="rotate-180" />
        </Link>
      </div>
    </div>
  );
}
