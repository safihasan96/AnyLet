import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MapPin, Bed, DoorOpen, Building2, Phone, MessageSquare, Image as ImageIcon, Star } from 'lucide-react';

export default function PropertyDetails() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <header className="flex items-center p-4 justify-between sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => navigate(-1)} className="text-slate-700 dark:text-slate-300 p-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Property Details</h1>
        <button className="text-slate-700 dark:text-slate-300 p-2">
          <Share2 size={24} />
        </button>
      </header>

      <div className="relative h-64 w-full">
        <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80" alt="Property" />
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm">
          <ImageIcon size={14} />
          1/12 Photos
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="h-1 w-6 bg-white rounded-full"></div>
          <div className="h-1 w-6 bg-white/50 rounded-full"></div>
          <div className="h-1 w-6 bg-white/50 rounded-full"></div>
          <div className="h-1 w-6 bg-white/50 rounded-full"></div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black tracking-tight leading-tight">Spacious 3BHK in Gulshan 2</h2>
          <button className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Heart size={20} className="fill-current" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-4">
          <MapPin size={16} />
          <span>Road 12, Gulshan 2, Dhaka</span>
        </div>

        <div className="mb-6">
          <span className="text-3xl font-black text-primary">BDT 45,000</span>
          <span className="text-slate-500 ml-1">/ month</span>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <Bed size={18} className="text-primary" />
            <span className="font-bold text-sm">3 Bed</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <DoorOpen size={18} className="text-primary" />
            <span className="font-bold text-sm">3 Bath</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <Building2 size={18} className="text-primary" />
            <span className="font-bold text-sm">1850 SqFt</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" alt="Owner" className="size-12 rounded-full object-cover" />
            <div>
              <h4 className="font-bold">Rahim Ahmed</h4>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Star size={12} className="fill-current" />
                Verified Owner
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm rounded-lg">
            View Profile
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3">Description</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Located in the heart of Gulshan 2, this beautiful 3BHK apartment offers luxury and comfort. The flat is well-ventilated with plenty of natural light. Features high-quality wooden flooring, modern kitchen fittings, and south-facing balconies. Perfect for corporate professionals or small families.
          </p>
          <button className="text-primary font-bold text-sm mt-2">Read more</button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3">Amenities</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="text-primary"><Building2 size={18} /></div>
              <span className="text-sm font-medium">Lift (2)</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="text-primary"><Star size={18} /></div>
              <span className="text-sm font-medium">Generator</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="text-primary"><Star size={18} /></div>
              <span className="text-sm font-medium">Line Gas</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="text-primary"><Star size={18} /></div>
              <span className="text-sm font-medium">24/7 Security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="text-primary"><Star size={18} /></div>
              <span className="text-sm font-medium">Car Parking</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="text-primary"><Star size={18} /></div>
              <span className="text-sm font-medium">WASA Water</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3">Location</h3>
          <div className="h-48 rounded-xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Map" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-primary text-white p-2 rounded-full mb-1">
                <MapPin size={24} />
              </div>
              <span className="font-bold text-sm bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur">Gulshan 2, Dhaka</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3 z-50">
        <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20">
          <Phone size={20} />
          Call Owner
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-primary border-2 border-primary font-bold py-3.5 rounded-xl">
          <MessageSquare size={20} />
          Message
        </button>
      </div>
    </div>
  );
}
