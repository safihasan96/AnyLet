import { Building2, Star, MapPin, Phone, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

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
        <div className="min-h-screen bg-surface-sunken pb-16">
            {/* Cover Photo */}
            <div className="h-48 md:h-64 bg-primary relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Agent Details Card */}
                    <Card className="lg:w-96 shrink-0 relative flex flex-col items-center">
                        <img loading="lazy" src={agent.avatar} alt={agent.name} className="size-32 rounded-3xl border-4 border-surface shadow-md bg-surface-sunken -mt-16 mb-4 object-cover" />
                        
                        <div className="text-center w-full border-b border-border pb-6 mb-6">
                            <h1 className="text-2xl font-bold text-content mb-1 flex items-center justify-center gap-2">
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
                                <span className="font-bold text-muted">Listings Active</span>
                                <span className="font-bold text-content">{agent.listings}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-muted">Reviews</span>
                                <span className="font-bold text-content">{agent.reviewsCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-muted">Member Since</span>
                                <span className="font-bold text-content">{agent.joined}</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <Button fullWidth size="lg" className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                                <MessageCircle size={20} /> WhatsApp
                            </Button>
                            <Button fullWidth size="lg" variant="secondary">
                                <Phone size={20} /> Call Agent
                            </Button>
                        </div>
                    </Card>

                    {/* Right: Content */}
                    <div className="flex-1 mt-6 lg:mt-24 space-y-8">
                        <Card>
                            <h2 className="text-xl font-bold text-content mb-4">About Me</h2>
                            <p className="text-muted leading-relaxed font-medium">
                                {agent.about}
                            </p>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-bold text-content mb-6 flex justify-between items-center">
                                Active Properties
                                <Link to="/search" className="text-sm font-bold text-primary">View All &gt;</Link>
                            </h2>
                            <div className="flex items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl">
                                <div className="text-center">
                                    <Building2 className="text-muted mx-auto mb-3" size={48} />
                                    <p className="text-muted font-bold">Property cards will render here dynamically.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
