import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { Camera, Edit, MapPin, Calendar, Building2, MessageCircle, Save, X, Plus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import logger from '../utils/logger';
import { Skeleton } from '../components/Skeleton';

export default function SetupOwnerProfile() {
    const { currentUser } = useAuth();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable fields
    const [bio, setBio] = useState('');
    const [coverPhoto, setCoverPhoto] = useState('');
    
    // Stats (mock for now, or computed if possible)
    const [propertiesCount, setPropertiesCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;
        
        async function fetchUserData() {
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setBio(data.bio || '');
                    setCoverPhoto(data.coverPhoto || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
                    // In a real scenario, you might count properties managed by querying the properties collection
                    setPropertiesCount(data.managedPropertiesCount || 0);
                }
            } catch (error) {
                logger.error('Error fetching user data for setup profile', error);
            } finally {
                setLoading(false);
            }
        }
        
        fetchUserData();
    }, [currentUser]);

    const handleSave = async () => {
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                bio,
                coverPhoto
            });
            setUserData(prev => ({ ...prev, bio, coverPhoto }));
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            logger.error('Error updating profile', error);
            toast.error('Failed to update profile.');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 flex flex-col gap-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full max-w-4xl mx-auto rounded-2xl -mt-16" />
        </div>
    );

    if (!userData) return null;

    const joinYear = userData.createdAt?.toDate 
        ? userData.createdAt.toDate().getFullYear() 
        : new Date(userData.createdAt).getFullYear() || new Date().getFullYear();

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24">
            <Helmet>
                <title>Setup Owner Profile | Any-Let</title>
            </Helmet>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
                
                {/* Profile Header Card */}
                <section className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {/* Cover Photo Area */}
                    <div className="h-48 md:h-72 w-full relative group">
                        <div 
                            className="bg-cover bg-center w-full h-full transition-all duration-300"
                            style={{ backgroundImage: `url(${coverPhoto})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
                                    <Camera size={20} />
                                    Change Cover Photo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="relative px-6 md:px-10 pb-8 md:pb-10 -mt-20 md:-mt-24 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 z-10">
                        <div className="relative group">
                            <img 
                                src={userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=1a227f&color=fff`}
                                alt="Profile" 
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-md bg-white"
                            />
                            {/* Profile picture is usually edited in EditProfile, but we can leave a hint */}
                            <button className="absolute bottom-2 right-2 bg-[#1a227f] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-2 border-white dark:border-slate-900">
                                <Camera size={18} />
                            </button>
                        </div>
                        
                        <div className="text-center md:text-left flex-1 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {userData.displayName}
                            </h1>
                            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-1.5 mt-2">
                                <MapPin size={16} className="text-[#1a227f] dark:text-indigo-400" />
                                {userData.location || 'Bangladesh'} • {userData.membershipTier || 'Standard Host'}
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0 mb-2">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={handleSave}
                                        className="bg-[#1a227f] text-white px-8 py-3.5 rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1a227f]/20"
                                    >
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setBio(userData.bio || '');
                                            setCoverPhoto(userData.coverPhoto || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80');
                                            setIsEditing(false);
                                        }}
                                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#1a227f] text-white px-8 py-3.5 rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1a227f]/20"
                                >
                                    <Edit size={18} />
                                    Edit Public Profile
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Bento Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* Bio (Spans 2 cols) */}
                    <div className="md:col-span-2 space-y-6 md:space-y-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageCircle size={20} className="text-[#1a227f] dark:text-indigo-400" />
                                About Me
                            </h3>
                            {isEditing ? (
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell potential tenants about yourself, your hosting experience, and your properties..."
                                    className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#1a227f]/20 rounded-2xl p-4 font-medium text-slate-700 dark:text-slate-300 outline-none resize-none"
                                />
                            ) : (
                                <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {userData.bio || "No bio added yet. Click 'Edit Public Profile' to tell potential tenants about yourself."}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats (1 col) */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                                <Calendar size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">{joinYear}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Member Since</span>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-[#1a227f] dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                                <Building2 size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">{propertiesCount}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Properties Managed</span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                                <MessageCircle size={28} strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                                {userData.responseRate ? `${userData.responseRate}%` : 'N/A'}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Response Rate</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
