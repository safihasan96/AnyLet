import { Users, Target, Clock, ShieldCheck, MapPin } from 'lucide-react';

export default function AboutUs() {
    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16">
            <div className="max-w-4xl mx-auto px-6">
                <header className="text-center mb-16">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">About Any-Let</h1>
                    <p className="text-lg text-slate-500 font-medium">Reimagining the property rental experience in Bangladesh.</p>
                </header>

                <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 dark:border-slate-800 mb-12">
                    <div className="flex items-center gap-4 mb-6 text-[#3E2B88]">
                        <Target size={32} strokeWidth={2.5} />
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Our Mission</h2>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        Our mission is to create a transparent, efficient, and fraud-free digital ecosystem for renting and managing properties in Bangladesh. We believe that finding a home should be an exciting journey, not a stressful ordeal.
                    </p>
                </section>

                <section className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800">
                        <Users size={28} className="text-[#3E2B88] mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Our Team</h3>
                        <p className="text-slate-500 text-sm font-medium">Built by a passionate team of engineers and real-estate enthusiasts dedicated to solving housing accessibility.</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-[32px] p-8 border border-emerald-100 dark:border-emerald-500/20">
                        <ShieldCheck size={28} className="text-emerald-600 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Trust Policy</h3>
                        <p className="text-slate-500 text-sm font-medium">Every user and listing goes through strict verification to ensure safety for both tenants and owners.</p>
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 text-center">Company Timeline</h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <Clock className="text-[#3E2B88] shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">2023 - The Idea</h4>
                                <p className="text-slate-500 text-sm mt-1">Conceived the concept of a unified rental hub.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <MapPin className="text-[#3E2B88] shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">2024 - Beta Launch</h4>
                                <p className="text-slate-500 text-sm mt-1">Successfully connected over 1,000 tenants in Dhaka.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Target className="text-[#3E2B88] shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">2026 - Nationwide Expansion</h4>
                                <p className="text-slate-500 text-sm mt-1">Expanding our trusted network across all major cities.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
