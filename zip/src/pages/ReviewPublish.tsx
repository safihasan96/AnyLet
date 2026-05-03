import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Bed, DoorOpen, Building2, CheckCircle2 } from 'lucide-react';

export default function ReviewPublish() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <header className="flex items-center p-4 justify-between sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300 p-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Review & Publish</h1>
        <button className="text-primary font-bold text-sm">Cancel</button>
      </header>

      <div className="flex w-full flex-row items-center justify-center gap-3 py-6">
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-2 rounded-full bg-primary/20"></div>
        <div className="h-2 w-8 rounded-full bg-primary"></div>
      </div>

      <main className="px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight mb-1">Final Review</h2>
          <p className="text-sm text-slate-500">Step 4 of 4: Check your listing details</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="relative h-48 w-full">
            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80" alt="Property Preview" />
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-xs font-bold">
              Preview
            </div>
            <div className="absolute bottom-3 left-3 bg-primary text-white px-3 py-1 rounded-lg font-bold text-sm">
              ৳ 45,000/mo
            </div>
          </div>
          <div className="p-4">
            <h4 className="font-bold text-lg mb-1">Modern 3BHK Flat in Gulshan 2</h4>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-4">
              <MapPin size={14} />
              <span>Road 12, Gulshan 2, Dhaka</span>
            </div>
            <div className="flex gap-4 border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Bed size={16} />
                <span className="text-xs font-medium">3 Bed</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <DoorOpen size={16} />
                <span className="text-xs font-medium">3 Bath</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Building2 size={16} />
                <span className="text-xs font-medium">1850 sqft</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Property Type</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">Flat / Apartment</p>
            </div>
            <button className="text-primary text-sm font-bold">Edit</button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Tenant Preference</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">Family Only</p>
            </div>
            <button className="text-primary text-sm font-bold">Edit</button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Available From</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">01 November, 2023</p>
            </div>
            <button className="text-primary text-sm font-bold">Edit</button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 flex gap-3">
          <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            By publishing this listing, you agree to our Terms of Service and confirm that the provided information is accurate.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 z-50 flex gap-3">
        <button onClick={() => navigate(-1)} className="w-1/3 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl">
          Back
        </button>
        <Link to="/published" className="w-2/3 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20">
          Publish Listing
        </Link>
      </div>
    </div>
  );
}
