import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ArrowLeft, Camera, MapPin, MessageCircle } from 'lucide-react';

export default function EditProfile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        location: '',
        photoURL: ''
    });

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({
                        fullName: data.fullName || '',
                        email: currentUser.email || '',
                        phone: data.phone || '',
                        whatsappNumber: data.whatsappNumber || '',
                        location: data.location || '',
                        photoURL: data.photoURL || currentUser.photoURL || ''
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneStr = formData.phone ? String(formData.phone) : '';
        const phoneDigits = phoneStr.replace(/\D/g, '');
        if (phoneStr && phoneDigits.length !== 11) {
            setMessage({ type: 'error', text: 'Mobile number must be exactly 11 digits.' });
            return;
        } else if (!phoneStr) {
            setMessage({ type: 'error', text: 'Mobile number is required.' });
            return;
        }

        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const userRef = doc(db, 'users', currentUser.uid);
            // Sanitise WhatsApp number to digits only
            const waDigits = formData.whatsappNumber ? formData.whatsappNumber.replace(/\D/g, '') : '';
            await updateDoc(userRef, {
                fullName: formData.fullName,
                phone: phoneDigits,
                whatsappNumber: waDigits,
                location: formData.location,
                photoURL: formData.photoURL
            });

            if (currentUser) {
                await updateProfile(currentUser, { 
                    displayName: formData.fullName,
                    photoURL: formData.photoURL 
                });
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Optional: navigate back after a short delay
            // setTimeout(() => navigate('/profile'), 1500);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        setMessage({ type: '', text: '' });
        
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cn6piwep');

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmkbsddqk';
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cn6piwep';
            
            console.log('Attempting profile photo upload...', { 
                cloudName, 
                preset: uploadPreset ? `${uploadPreset.substring(0, 3)}***` : 'MISSING' 
            });

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: data
            });
            const fileData = await res.json();
            
            if (fileData.secure_url) {
                setFormData(prev => ({ ...prev, photoURL: fileData.secure_url }));
                setMessage({ type: 'success', text: 'Photo uploaded! Don\'t forget to save changes.' });
            } else {
                console.error("Cloudinary Error:", fileData);
                setMessage({ type: 'error', text: `Upload failed: ${fileData.error?.message || "Unknown error"} (Cloud: ${cloudName}, Preset: ${uploadPreset ? uploadPreset.substring(0,3) + '...' : 'None'})` });
            }
        } catch (err) {
            console.error("Cloudinary Connection Error:", err);
            setMessage({ type: 'error', text: 'Connection error during upload.' });
        } finally {
            setSaving(false);
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name[0].toUpperCase();
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-[#3730a3]">Loading profile...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-28">
            <header className="flex items-center p-6 mb-2">
                <button onClick={() => navigate(-1)} className="text-slate-800 dark:text-white p-2 border border-transparent -ml-2">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="text-lg font-[900] text-slate-900 dark:text-white flex-1 text-center pr-8 tracking-tight">Edit Profile</h1>
            </header>

            <div className="flex-1 flex flex-col items-center px-6 max-w-md mx-auto w-full">

                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div className="size-[120px] rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-sm overflow-hidden flex items-center justify-center text-5xl font-bold text-[#3730a3] dark:text-indigo-400">
                            {formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(formData.fullName)
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="profile-photo-upload"
                        />
                        <label 
                            htmlFor="profile-photo-upload"
                            className="absolute bottom-0 right-0 size-10 bg-[#3730a3] text-white rounded-full flex items-center justify-center border-[3px] border-[#f8fafc] dark:border-slate-950 shadow-md cursor-pointer hover:scale-110 transition-transform"
                        >
                            <Camera size={18} strokeWidth={2.5} />
                        </label>
                    </div>
                    <label 
                        htmlFor="profile-photo-upload"
                        className="bg-[#e2e8f0] dark:bg-slate-800 text-[#3730a3] dark:text-indigo-400 font-[800] text-sm py-2.5 px-6 rounded-full tracking-wide cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        {saving ? "Uploading..." : "Change Photo"}
                    </label>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl font-bold text-sm mb-6 w-full text-center ${message.type === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-5">

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[800] text-[#1e293b] dark:text-slate-200 ml-1">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Anisur Rahman"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] py-[16px] px-5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#3730a3] focus:ring-1 focus:ring-[#3730a3] transition-all shadow-sm text-[15px]"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[800] text-[#1e293b] dark:text-slate-200 ml-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="anisur@example.com"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[20px] py-[16px] px-5 font-semibold text-slate-500 dark:text-slate-400 outline-none shadow-sm text-[15px] cursor-not-allowed opacity-80"
                            value={currentUser?.email || ''}
                            readOnly
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[800] text-[#1e293b] dark:text-slate-200 ml-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="01712345678"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] py-[16px] px-5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#3730a3] focus:ring-1 focus:ring-[#3730a3] transition-all shadow-sm text-[15px]"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[800] text-[#1e293b] dark:text-slate-200 ml-1 flex items-center gap-2">
                            <MessageCircle size={15} className="text-[#25D366]" />
                            WhatsApp Number
                            <span className="text-[11px] font-semibold text-slate-400 normal-case">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            name="whatsappNumber"
                            placeholder="01812345678"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] py-[16px] px-5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all shadow-sm text-[15px]"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                        />
                        <p className="text-[11px] text-slate-400 font-semibold ml-1 mt-1">
                            Enables a "Chat on WhatsApp" button on your listings.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[14px] font-[800] text-[#1e293b] dark:text-slate-200 ml-1">Location</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="location"
                                placeholder="Dhaka, Bangladesh"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] py-[16px] pl-5 pr-12 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#3730a3] focus:ring-1 focus:ring-[#3730a3] transition-all shadow-sm text-[15px]"
                                value={formData.location}
                                onChange={handleChange}
                            />
                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={20} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={saving}
                            className="w-full bg-[#3730a3] text-white font-[800] text-[15px] py-[18px] rounded-[24px] shadow-lg shadow-[#3730a3]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {saving ? "SAVING..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
