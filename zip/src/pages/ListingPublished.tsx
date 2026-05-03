import { Link } from 'react-router-dom';
import { CheckCircle, Share2, Eye, Home } from 'lucide-react';

export default function ListingPublished() {
  return (
    <div className="flex flex-col min-h-screen bg-primary text-white pb-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 size-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-20 size-80 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center mt-12">
        <div className="size-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-black/20 animate-bounce">
          <CheckCircle size={48} className="text-primary" />
        </div>
        
        <h1 className="text-4xl font-black tracking-tight mb-4">Congratulations!</h1>
        <p className="text-lg text-white/80 mb-12 max-w-xs leading-relaxed">
          Your property has been successfully listed and is now visible to thousands of potential tenants.
        </p>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full mb-8">
          <h3 className="font-bold text-lg mb-4 text-left">What happens next?</h3>
          <ul className="text-sm text-white/80 space-y-4 text-left">
            <li className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
              <span>We'll notify users looking for properties in your area.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
              <span>You'll receive messages and calls from interested tenants.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">3</div>
              <span>Manage your listing from the Landlord Dashboard.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col w-full gap-4">
          <button className="w-full bg-white text-primary font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
            <Share2 size={20} />
            Share Listing
          </button>
          <button className="w-full bg-transparent border-2 border-white/30 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
            <Eye size={20} />
            View Live Listing
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-50">
        <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 text-white/80 font-bold py-3.5 hover:text-white transition-colors">
          <Home size={20} />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
