import { MapPin, Phone, Mail, Send } from 'lucide-react';

export default function Contact() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
            <div className="max-w-6xl mx-auto px-6">
                <header className="text-center mb-16">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Contact Support</h1>
                    <p className="text-lg text-slate-500 font-medium">We're here to help you 24/7.</p>
                </header>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-5">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0"><MapPin size={24} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Office Address</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">Gulshan 1, Dhaka 1212<br/>Bangladesh</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-5">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 shrink-0"><Phone size={24} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Phone Number</h3>
                                <p className="text-slate-500 text-sm mb-1">+880 1700-000000</p>
                                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">10 AM - 6 PM</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-5">
                            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0"><Mail size={24} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Email Address</h3>
                                <p className="text-slate-500 text-sm">support@anylet.com.bd</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <form className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Send a Message</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Your Name</label>
                                <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message</label>
                                <textarea required rows="4" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white resize-none"></textarea>
                            </div>
                            
                            <button type="submit" className="w-full bg-primary text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                                <Send size={20} /> Send Message
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
