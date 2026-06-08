import { Search, MapPin, Star, Building2, Phone, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_AGENTS = [
    { id: '1', name: 'Rahim Uddin', agency: 'Trust Realtors BD', specialization: 'Luxury Apartments', listings: 45, rating: 4.8, city: 'Dhaka', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rahim&backgroundColor=f1f5f9' },
    { id: '2', name: 'Karim Hasan', agency: 'Green Earth Properties', specialization: 'Commercial Spaces', listings: 32, rating: 4.5, city: 'Chittagong', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Karim&backgroundColor=f1f5f9' },
    { id: '3', name: 'Sabina Yasmin', agency: 'Urban Living', specialization: 'Family Homes', listings: 56, rating: 4.9, city: 'Dhaka', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sabina&backgroundColor=f1f5f9' },
    { id: '4', name: 'Tarique Rahman', agency: 'Prime Deals', specialization: 'Student Hostels', listings: 20, rating: 4.2, city: 'Sylhet', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Tarique&backgroundColor=f1f5f9' },
];

export default function Agents() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <header className="mb-10 block md:flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Find a Registered Agent</h1>
                        <p className="text-slate-500 font-medium">Connect with top-rated property managers and realtors in your city.</p>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="lg:w-72 shrink-0">
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 sticky top-28 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-800">
                                <Filter size={20} />
                                <h3 className="font-black">Filter Agents</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Search by Name</label>
                                    <div className="relative">
                                        <input type="text" placeholder="e.g. Rahim" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-4 font-semibold text-sm outline-none focus:border-primary transition-all text-slate-900 dark:text-white" />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">City</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 font-semibold text-sm outline-none focus:border-primary transition-all text-slate-900 dark:text-white">
                                        <option value="">All Cities</option>
                                        <option value="Dhaka">Dhaka</option>
                                        <option value="Chittagong">Chittagong</option>
                                        <option value="Sylhet">Sylhet</option>
                                    </select>
                                </div>

                                <button className="w-full py-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black tracking-wide hover:opacity-90 transition-opacity">Apply Filters</button>
                            </div>
                        </div>
                    </div>

                    {/* Agent Grid */}
                    <div className="flex-1 grid md:grid-cols-2 gap-6">
                        {MOCK_AGENTS.map(agent => (
                            <div key={agent.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col hover:border-primary/30 transition-colors group">
                                <div className="flex items-start gap-4 mb-6">
                                    <img src={agent.avatar} alt={agent.name} className="size-20 w-20 h-20 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800" />
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/agent/${agent.id}`} className="block">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1 truncate group-hover:text-primary dark:text-indigo-400 transition-colors">{agent.name}</h3>
                                        </Link>
                                        <p className="text-sm font-bold text-primary dark:text-indigo-400 mb-1 truncate">{agent.agency}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {agent.city}</span>
                                            <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {agent.rating} Rating</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col justify-center mb-6">
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                        <span>Specialization:</span>
                                        <span className="text-slate-900 dark:text-white text-right">{agent.specialization}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                                        <span>Active Listings:</span>
                                        <span className="text-slate-900 dark:text-white">{agent.listings} Properties</span>
                                    </div>
                                </div>
                                
                                <Link to={`/agent/${agent.id}`} className="w-full py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-700 font-bold hover:border-primary hover:text-primary dark:text-indigo-400 transition-colors flex items-center justify-center gap-2 group-hover:bg-slate-50">
                                    <Building2 size={18} /> View Profile
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
