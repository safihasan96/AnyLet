import { Users, Target, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { Card } from '../components/ui';

const TIMELINE = [
    { icon: Clock,   year: '2023', title: 'The Idea',            desc: 'Conceived the concept of a unified rental hub.' },
    { icon: MapPin,  year: '2024', title: 'Beta Launch',         desc: 'Successfully connected over 1,000 tenants in Dhaka.' },
    { icon: Target,  year: '2026', title: 'Nationwide Expansion', desc: 'Expanding our trusted network across all major cities.' },
];

export default function AboutUs() {
    return (
        <div className="bg-surface-sunken min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-6">

                <header className="text-center mb-16">
                    <h1 className="text-display-sm font-bold text-content mb-4">About Any-Let</h1>
                    <p className="text-body-lg text-muted max-w-xl mx-auto leading-relaxed">
                        Reimagining the property rental experience in Bangladesh.
                    </p>
                </header>

                {/* Mission */}
                <Card padding="lg" className="mb-8">
                    <div className="flex items-center gap-4 mb-5 text-primary">
                        <Target size={28} strokeWidth={2.5} />
                        <h2 className="text-title-lg font-bold text-content">Our Mission</h2>
                    </div>
                    <p className="text-body-md text-muted leading-relaxed">
                        Our mission is to create a transparent, efficient, and fraud-free digital ecosystem for
                        renting and managing properties in Bangladesh. We believe that finding a home should be
                        an exciting journey, not a stressful ordeal.
                    </p>
                </Card>

                {/* Team + Trust grid */}
                <section className="grid md:grid-cols-2 gap-6 mb-8">
                    <Card padding="lg" variant="sunken">
                        <Users size={26} className="text-primary mb-4" />
                        <h3 className="text-title-sm font-bold text-content mb-2">Our Team</h3>
                        <p className="text-body-sm text-muted leading-relaxed">
                            Built by a passionate team of engineers and real-estate enthusiasts dedicated to
                            solving housing accessibility.
                        </p>
                    </Card>
                    <Card padding="lg" className="border-success/30 bg-success/5">
                        <ShieldCheck size={26} className="text-success mb-4" />
                        <h3 className="text-title-sm font-bold text-content mb-2">Trust Policy</h3>
                        <p className="text-body-sm text-muted leading-relaxed">
                            Every user and listing goes through strict verification to ensure safety for both
                            tenants and owners.
                        </p>
                    </Card>
                </section>

                {/* Timeline */}
                <Card padding="lg">
                    <h2 className="text-title-md font-bold text-content mb-8 text-center">Company Timeline</h2>
                    <div className="space-y-6">
                        {TIMELINE.map(({ icon: Icon, year, title, desc }) => (
                            <div key={year} className="flex gap-4">
                                <div className="shrink-0 mt-0.5 size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-content">{year} — {title}</h4>
                                    <p className="text-body-sm text-muted mt-1">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    );
}
