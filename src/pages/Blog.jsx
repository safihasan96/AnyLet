import { Calendar, Clock, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_POSTS = [
    {
        id: '1',
        title: 'Top 10 Areas to Rent in Dhaka for Families',
        category: 'Area Guides',
        excerpt: 'Discover the most family-friendly neighborhoods in Dhaka featuring good schools, parks, and security.',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Safi Hasan',
        date: 'Oct 15, 2026',
        readTime: '5 min read'
    },
    {
        id: '2',
        title: 'Understanding Tenancy Laws in Bangladesh',
        category: 'Legal',
        excerpt: 'A comprehensive guide on your rights as a tenant and what to look out for in a rental agreement.',
        image: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Any-Let Legal',
        date: 'Oct 12, 2026',
        readTime: '8 min read'
    },
    {
        id: '3',
        title: 'How to Decorate a Small Apartment',
        category: 'Tips',
        excerpt: 'Maximize your space with these creative interior design tips for small flats.',
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        author: 'Interior Design Team',
        date: 'Oct 05, 2026',
        readTime: '4 min read'
    }
];

export default function Blog() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <header className="text-center mb-16">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Any-Let Blog & Guides</h1>
                    <p className="text-lg text-slate-500 font-medium">Tips, legal advice, and market trends for renting in Bangladesh.</p>
                </header>

                <div className="flex gap-4 overflow-x-auto pb-4 mb-10 no-scrollbar justify-center">
                    {['All', 'Market Trends', 'Area Guides', 'Legal', 'Tips'].map(cat => (
                        <button key={cat} className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${cat === 'All' ? 'bg-[#3E2B88] text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#3E2B88]'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {MOCK_POSTS.map(post => (
                        <Link to={`/blog/${post.id}`} key={post.id} className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm group hover:-translate-y-1 hover:shadow-xl transition-all">
                            <div className="relative h-56 overflow-hidden">
                                <img loading="lazy" src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest text-[#3E2B88]">
                                    {post.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-[#3E2B88] transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{post.author}</p>
                                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Calendar size={10} /> {post.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={12} /> {post.readTime}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
