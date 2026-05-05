import { Link } from 'react-router-dom';
import { Building2, Facebook, Twitter, Instagram, Linkedin, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                
                {/* Top Section: Links & Newsletter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
                    
                    {/* Brand & Newsletter Column (Spans 2) */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 group mb-6 inline-flex">
                            <div className="bg-[#3E2B88] p-2.5 rounded-2xl text-white shadow-lg shadow-[#3E2B88]/20 group-hover:rotate-12 transition-transform">
                                <Building2 size={24} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                                any<span className="text-[#3E2B88] italic">.let</span>
                            </span>
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm">
                            The smartest way to rent, buy, and manage properties in Bangladesh. Finding your next home has never been easier.
                        </p>
                        
                        <div className="space-y-4">
                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Subscribe to Newsletter</h4>
                            <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-[#3E2B88] transition-colors max-w-sm">
                                <div className="flex items-center justify-center pl-3 pr-2 text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="bg-transparent border-none outline-none flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 w-full min-w-0"
                                />
                                <button className="bg-[#3E2B88] text-white p-2.5 rounded-xl hover:scale-105 transition-transform shrink-0">
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">For Tenants</h4>
                        <ul className="space-y-4 font-bold text-sm text-slate-500 dark:text-slate-400">
                            <li><Link to="/search" className="hover:text-[#3E2B88] transition-colors">Search Properties</Link></li>
                            <li><Link to="/favorites" className="hover:text-[#3E2B88] transition-colors">Saved Listings</Link></li>
                            <li><Link to="/requests" className="hover:text-[#3E2B88] transition-colors">My Enquiries</Link></li>
                            <li><Link to="/blog/tenant-tips" className="hover:text-[#3E2B88] transition-colors">Renting Guide</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">For Owners</h4>
                        <ul className="space-y-4 font-bold text-sm text-slate-500 dark:text-slate-400">
                            <li><Link to="/post-ad" className="hover:text-[#3E2B88] transition-colors">Post a Listing</Link></li>
                            <li><Link to="/pricing" className="hover:text-[#3E2B88] transition-colors">Pricing Plans</Link></li>
                            <li><Link to="/my-listings" className="hover:text-[#3E2B88] transition-colors">Manage Ads</Link></li>
                            <li><Link to="/blog/owner-tips" className="hover:text-[#3E2B88] transition-colors">Landlord Advice</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">Company & Legal</h4>
                        <ul className="space-y-4 font-bold text-sm text-slate-500 dark:text-slate-400">
                            <li><Link to="/about" className="hover:text-[#3E2B88] transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-[#3E2B88] transition-colors">Contact Support</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-[#3E2B88] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-[#3E2B88] transition-colors">Terms & Conditions</Link></li>
                            <li><Link to="/sitemap" className="hover:text-[#3E2B88] transition-colors">Sitemap</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section: Badges & Socials */}
                <div className="flex flex-col md:flex-row items-center justify-between py-6 border-t border-slate-100 dark:border-slate-800 gap-6">
                    
                    {/* App & Trust Badges */}
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <Link to="/download" className="h-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center px-4 hover:scale-105 transition-transform">
                            <span className="text-white text-xs font-black tracking-wide">Get the App</span>
                        </Link>
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl text-xs font-black">
                            <ShieldCheck size={16} /> SSO Secure
                        </div>
                    </div>

                    {/* Socials */}
                    <div className="flex items-center gap-3">
                        {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                            <a key={i} href="#" className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#3E2B88] hover:border-[#3E2B88] transition-all">
                                <Icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center mt-6">
                    <p className="text-xs font-bold text-slate-400">
                        &copy; {new Date().getFullYear()} Any-Let Bangladesh. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
