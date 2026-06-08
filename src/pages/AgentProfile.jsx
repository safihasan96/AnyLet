import { Building2, Star, MapPin, Phone, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

export default function AgentProfile() {
    const { id } = useParams();
    
    // Mock data for the specific agent based on ID
    const agent = {
        id: id || '1',
        name: 'Rahim Uddin',
        agency: 'Trust Realtors BD',
        about: 'With over 10 years of experience in the Dhaka real estate market, I specialize in finding the perfect luxury apartments for premium clients. My dedication to transparency and honest deals has earned me top ratings.',
        specialization: 'Luxury Apartments',
        listings: 45,
        rating: 4.8,
        reviewsCount: 124,
        city: 'Dhaka',
        joined: '2020',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rahim&backgroundColor=f1f5f9'
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
            {/* Cover Photo */}
            <div className="h-48 md:h-64 bg-primary relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Agent Details Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-xl border border-slate-100 dark:border-slate-800 lg:w-96 shrink-0 relative flex flex-col items-center">
                        <img src={agent.avatar} alt={agent.name} className="size-32 rounded-3xl border-4 border-white dark:border-slate-900 shadow-md bg-slate-100 -mt-24 mb-4 object-cover" />
                        
                        <div className="text-center w-full border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1 flex items-center justify-center gap-2">
                                {agent.name}
                                <ShieldCheck className="text-emerald-500" size={20} />
                            </h1>
                            <p className="text-primary dark:text-indigo-400 font-bold">{agent.agency}</p>
                            
                            <div className="flex items-center justify-center gap-4 mt-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1"><MapPin size={16} /> {agent.city}</span>
                                <span className="flex items-center gap-1"><Star size={16} className="text-yellow-500 fill-yellow-500" /> {agent.rating}</span>
                            </div>
                        </div>

                        <div className="w-full space-y-4 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500">Listings Active</span>
                                <span className="font-black text-slate-900 dark:text-white">{agent.listings}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500">Reviews</span>
                                <span className="font-black text-slate-900 dark:text-white">{agent.reviewsCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500">Member Since</span>
                                <span className="font-black text-slate-900 dark:text-white">{agent.joined}</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <button className="w-full bg-[#25D366] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-lg shadow-[#25D366]/20">
                                <MessageCircle size={20} /> WhatsApp
                            </button>
                            <button className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <Phone size={20} /> Call Agent
                            </button>
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 mt-6 lg:mt-24 space-y-8">
                        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">About Me</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                {agent.about}
                            </p>
                        </section>

                        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex justify-between items-center">
                                Active Properties
                                <Link to="/search" className="text-sm font-bold text-primary dark:text-indigo-400">View All &gt;</Link>
                            </h2>
                            <div className="flex items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                                <div className="text-center">
                                    <Building2 className="text-slate-300 dark:text-slate-600 mx-auto mb-3" size={48} />
                                    <p className="text-slate-500 font-bold">Property cards will render here dynamically.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
