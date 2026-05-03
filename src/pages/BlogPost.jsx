import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function BlogPost() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Hero Image */}
            <div className="w-full h-[40vh] md:h-[50vh] relative">
                <img 
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                    alt="Blog Cover" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 md:top-10 md:left-10 bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white hover:bg-white/30 transition-colors">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Area Guides</span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-8">
                        Top 10 Areas to Rent in Dhaka for Families ({id})
                    </h1>

                    <div className="flex flex-wrap items-center justify-between gap-6 border-y border-slate-100 dark:border-slate-800 py-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">Safi Hasan</p>
                                <p className="text-xs font-bold text-slate-500 mt-0.5">Author</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                            <span className="flex items-center gap-1.5"><Calendar size={16} /> Oct 15, 2026</span>
                            <span className="flex items-center gap-1.5"><Clock size={16} /> 5 min read</span>
                            <button className="flex items-center gap-1.5 text-primary hover:opacity-80 transition-opacity">
                                <Share2 size={16} /> Share
                            </button>
                        </div>
                    </div>

                    <div className="prose prose-lg dark:prose-invert prose-indigo max-w-none">
                        <p className="lead text-xl text-slate-600 dark:text-slate-300 font-medium mb-8">
                            Finding the right neighborhood in Dhaka can be challenging, especially when you have a family to consider. You want a place that's safe, close to schools, and has enough recreational spaces.
                        </p>
                        
                        <h2 className="text-2xl font-black mb-4">1. Gulshan</h2>
                        <p className="mb-6">Known for its security and expat community, Gulshan offers tree-lined streets, premium grocery stores, and some of the best international schools in the country. Rent here is premium, but the amenities are unparalleled.</p>
                        
                        <h2 className="text-2xl font-black mb-4">2. Dhanmondi</h2>
                        <p className="mb-6">Dhanmondi is the perfect blend of modern living and cultural heritage. With the Dhanmondi Lake offering a great space for evening walks and countless schools and hospitals nearby, it's a favorite for large families.</p>
                        
                        <h2 className="text-2xl font-black mb-4">3. Bashundhara Residential Area</h2>
                        <p className="mb-6">If you prefer a quieter, planned neighborhood away from the city's immediate rush, Bashundhara is ideal. It boasts wide roads, excellent security, and the largest shopping mall in South Asia right at its gate.</p>
                        
                        <h3 className="text-xl font-bold mb-3 mt-8">Conclusion</h3>
                        <p>When selecting your next family home, always prioritize proximity to your workplace and your children's schools to avoid Dhaka's infamous traffic. Use Any-Let's map feature to see nearby amenities before booking a visit!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
