import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { bdLocations } from '../data/locations';
import {
    ArrowLeft, ArrowRight, Building2, MapPin, Info, Image as ImageIcon,
    CheckCircle, Flame, Zap, Droplets, Wifi, Trash2, Battery,
    ShieldCheck, Car, Wind, Lock, DoorOpen, ChevronsUp, Phone,
    CloudSun, UtensilsCrossed, Thermometer, Package, Bike, Calendar, Users,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationPickerMap from '../components/LocationPickerMap';
import PaymentModal from '../components/PaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';

export default function AddProperty() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        if (currentUser && !currentUser.emailVerified) {
            toast.warning("Please verify your email address to post a property.");
            navigate('/');
        } else if (userProfile && !userProfile.phone) {
            toast.warning("Please add your phone number to your profile before posting a property.");
            navigate('/edit-profile');
        }
    }, [currentUser, userProfile, navigate, toast]);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Apartment',
        tenantType: 'Any',
        division: '',
        district: '',
        upazila: '',
        addressDetails: '',
        rent: '',
        area: '',
        beds: '1',
        baths: '1',
        description: '',
        imageUrl: '',
        image_url: '',
        images: [], // Store up to 5 images
        securityDeposit: '',
        utilitiesCost: '',
        billingCycle: 'Month',
        utilities: [],
        features: [],
        lat: null,
        lng: null
    });

    const [showSuccess, setShowSuccess] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

    const BILLING_CYCLES = ["Month", "Week", "Day"];
    const PROPERTY_TYPES = ["House", "Apartment", "Sublet", "Room", "Mess", "Cottage", "Hotel", "Resort", "Commercial Space", "Land", "Shop", "Others"];
    const TENANT_TYPES = ["Any", "Family", "Bachelor (Male)", "Bachelor (Female)"];

    // Location Helpers
    const divisions = useMemo(() => Object.keys(bdLocations), []);
    const districts = useMemo(() => {
        return formData.division ? Object.keys(bdLocations[formData.division] || {}) : [];
    }, [formData.division]);
    const thanas = useMemo(() => {
        return (formData.division && formData.district)
            ? bdLocations[formData.division][formData.district] || []
            : [];
    }, [formData.division, formData.district]);

    const UTILITY_OPTIONS = [
        { id: 'Prepaid Gas', icon: <Flame size={16} /> },
        { id: 'Line Gas', icon: <Flame size={16} /> },
        { id: 'Prepaid Electricity', icon: <Zap size={16} /> },
        { id: 'Postpaid Electricity', icon: <Zap size={16} /> },
        { id: 'Water (WASA)', icon: <Droplets size={16} /> },
        { id: 'Deep Tube-well Water', icon: <Droplets size={16} /> },
        { id: 'Central WiFi', icon: <Wifi size={16} /> },
        { id: 'Trash Collection', icon: <Trash2 size={16} /> },
        { id: 'Generator/IPS Backup', icon: <Battery size={16} /> }
    ];

    const FEATURE_OPTIONS = [
        { id: 'Lift/Elevator', icon: <ArrowRight className="rotate-[-90deg]" size={16} /> },
        { id: 'CCTV Security', icon: <ShieldCheck size={16} /> },
        { id: 'Fire Exit', icon: <DoorOpen size={16} /> },
        { id: 'Emergency Stairs', icon: <ChevronsUp size={16} /> },
        { id: 'Intercom', icon: <Phone size={16} /> },
        { id: 'Roof Access', icon: <CloudSun size={16} /> },
        { id: 'Drawing & Dining Separate', icon: <UtensilsCrossed size={16} /> },
        { id: 'Geyser Connection', icon: <Thermometer size={16} /> },
        { id: 'Cabinet/Wall Cupboard', icon: <Package size={16} /> },
        { id: 'Balcony', icon: <Wind size={16} /> },
        { id: 'Tiled Floor', icon: <Building2 size={16} /> },
        { id: 'Car Parking', icon: <Car size={16} /> },
        { id: 'Bike Parking', icon: <Bike size={16} /> }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Custom logic for cascading resets
        if (name === 'division') {
            setFormData(prev => ({ ...prev, division: value, district: '', upazila: '' }));
        } else if (name === 'district') {
            setFormData(prev => ({ ...prev, district: value, upazila: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleItem = (listName, id) => {
        setFormData(prev => {
            const list = prev[listName];
            const newList = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
            return { ...prev, [listName]: newList };
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Check if adding these files exceeds the 5-image limit
        if (formData.images.length + files.length > 5) {
            toast.warning("You can only upload up to 5 images in total.");
            return;
        }

        setLoading(true);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmkbsddqk';
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cn6piwep';
        
        const uploadedUrls = [];

        try {
            for (const file of files) {
                const data = new FormData();
                data.append('file', file);
                data.append('upload_preset', uploadPreset);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: data
                });
                const fileData = await res.json();
                
                if (!res.ok) {
                    console.error("Cloudinary Error:", fileData);
                    toast.error(`Upload failed!\nError: ${fileData.error?.message || "Unknown error"}`);
                    throw new Error(fileData.error?.message || 'Upload failed');
                }
                
                if (fileData.secure_url) {
                    uploadedUrls.push(fileData.secure_url);
                }
            }

            if (uploadedUrls.length > 0) {
                setFormData(prev => {
                    const newImages = [...prev.images, ...uploadedUrls];
                    return { 
                        ...prev, 
                        images: newImages,
                        imageUrl: newImages[0], // Keep for backward compatibility
                        image_url: newImages[0]  // Keep for backward compatibility
                    };
                });
            }
        } catch (error) {
            console.error('Error during upload process:', error);
            toast.error("Connection error while uploading to Cloudinary.");
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, index) => index !== indexToRemove);
            return {
                ...prev,
                images: newImages,
                imageUrl: newImages[0] || '',
                image_url: newImages[0] || ''
            };
        });
    };

    // Called by PaymentModal after user submits transaction ID
    const handlePaymentSubmitted = async (paymentDocId) => {
        if (!currentUser) return;
        setLoading(true);

        try {
            const propertyData = {
                ...formData,
                rent: Number(formData.rent),
                area: formData.area ? Number(formData.area) : null,
                beds: Number(formData.beds),
                baths: Number(formData.baths),
                securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : 0,
                utilitiesCost: Number(formData.utilitiesCost) || 0,
                ownerId: currentUser.uid,
                isApproved: false, // Payment pending admin verification
                listingPaymentId: paymentDocId,
                isOnsiteVerified: false,
                verificationPaymentId: null,
                verificationStatus: 'none',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'Available',
                expiryEmailSent: false
            };

            await addDoc(collection(db, 'properties'), propertyData);

            // Notify the owner that listing was submitted
            await createNotification(
                currentUser.uid,
                'system',
                'Listing Submitted',
                `Your property "${formData.title}" has been submitted for review. It will go live once our team verifies it — usually under 30 minutes.`,
                '/my-listings'
            );

            setPaymentModalOpen(false);
            setShowSuccess(true);
            setTimeout(() => navigate('/'), 4000);
        } catch (err) {
            console.error(err);
            toast.error('Failed to publish property. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 3) return;
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        if (step === 1) {
            navigate(-1);
            return;
        }
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleProceedToPayment = () => {
        setPublishConfirmOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-10 text-slate-900 dark:text-slate-100">
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 text-center max-w-sm w-full"
                        >
                            <div className="size-24 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-primary/20">
                                <CheckCircle size={48} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Payment Submitted!</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed text-lg">
                                Your listing is being verified — usually takes under 30 minutes. Redirecting you home...
                            </p>
                            <button 
                                onClick={() => navigate('/')}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20"
                            >
                                Take me Home
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex items-center p-4 justify-between sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <button onClick={prevStep} className="text-slate-700 dark:text-slate-300 p-2">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-black uppercase tracking-tight">Post Property</h1>
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                    </div>
                </div>
                <div className="w-10" />
            </header>

            <div className="p-5 max-w-2xl mx-auto w-full">
                {step === 1 && (
                    <div className="space-y-6 fade-in">
                        <Section title="Basic Details" icon={<Building2 size={20} />}>
                            <Input label="Property Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Modern Flat in Gulshan" required />
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Property Type" name="type" value={formData.type} onChange={handleChange}>
                                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                                <Input label="Rent (৳)" name="rent" type="number" value={formData.rent} onChange={handleChange} placeholder="25000" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                                        <Calendar size={12} /> Billing Cycle
                                    </label>
                                    <div className="flex gap-2 mt-2">
                                        {BILLING_CYCLES.map(cycle => (
                                            <button
                                                key={cycle}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, billingCycle: cycle }))}
                                                className={`flex-1 py-3 px-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-wider transition-all ${formData.billingCycle === cycle ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent text-slate-400'}`}
                                            >
                                                {cycle}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest flex items-center gap-1">
                                        <Users size={12} /> Tenant Type
                                    </label>
                                    <Select name="tenantType" value={formData.tenantType} onChange={handleChange}>
                                        {TENANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </div>
                            </div>
                        </Section>

                        <Section title="Location Setup" icon={<MapPin size={20} />}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Division" name="division" value={formData.division} onChange={handleChange} required>
                                        <option value="">Select Division</option>
                                        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                    <Select label="District" name="district" value={formData.district} onChange={handleChange} disabled={!formData.division} required>
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Thana / Upazila" name="upazila" value={formData.upazila} onChange={handleChange} disabled={!formData.district} required>
                                        <option value="">Select Thana</option>
                                        {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                    <Input label="House/Road No. (Details)" name="addressDetails" value={formData.addressDetails} onChange={handleChange} placeholder="e.g. House 5, Road 10" />
                                </div>
                                
                                <div className="pt-2">
                                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest block mb-2">Pin Exact Location on Map</label>
                                    <LocationPickerMap 
                                        lat={formData.lat} 
                                        lng={formData.lng} 
                                        division={formData.division}
                                        district={formData.district}
                                        upazila={formData.upazila}
                                        onLocationSelect={(coords) => setFormData(prev => ({ ...prev, lat: coords.lat, lng: coords.lng }))} 
                                    />
                                </div>
                            </div>
                        </Section>

                        <Section title="Specifications" icon={<Info size={20} />}>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Beds" name="beds" type="number" value={formData.beds} onChange={handleChange} />
                                <Input label="Baths" name="baths" type="number" value={formData.baths} onChange={handleChange} />
                                <Input label="SqFt (Optional)" name="area" type="number" value={formData.area} onChange={handleChange} placeholder="N/A" />
                            </div>
                            <Input label="Security Deposit (Optional)" name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleChange} placeholder="৳0" />
                            <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="Tell tenants about your space..." />
                        </Section>

                        <Section title="Media (Up to 5 images)" icon={<ImageIcon size={20} />}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {formData.images.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-rose-500/20"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-0 inset-x-0 bg-primary/80 backdrop-blur-sm py-1 text-[8px] font-black text-white text-center uppercase tracking-widest">
                                                    Main Cover
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {formData.images.length < 5 && (
                                        <div className="relative aspect-square">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden" 
                                                id="image-upload" 
                                                disabled={loading}
                                            />
                                            <label 
                                                htmlFor="image-upload"
                                                className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                                            >
                                                <div className="p-2 bg-primary/10 rounded-xl text-primary dark:text-indigo-400 mb-1">
                                                    <ImageIcon size={20} />
                                                </div>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                    {loading ? "..." : "Add Photo"}
                                                </p>
                                                <p className="text-[7px] font-bold text-slate-300 mt-0.5">{formData.images.length}/5</p>
                                            </label>
                                        </div>
                                    )}
                                </div>
                                
                                {loading && (
                                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-progress" style={{ width: '100%' }} />
                                    </div>
                                )}
                            </div>
                        </Section>

                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={!formData.title || !formData.rent || !formData.upazila || !formData.imageUrl}
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Continue: Amenities
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 fade-in">
                        <Section title="Utilities & Features" icon={<Info size={20} />}>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Included Utilities</label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {UTILITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleItem('utilities', opt.id)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${formData.utilities.includes(opt.id) ? 'bg-primary/10 border-primary text-primary dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent text-slate-500'}`}
                                            >
                                                {opt.icon}
                                                <span className="truncate">{opt.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input label="Monthly Utilities Cost (৳)" name="utilitiesCost" type="number" value={formData.utilitiesCost} onChange={handleChange} placeholder="e.g. 2000" />

                                <div>
                                    <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">Property Features</label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {FEATURE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleItem('features', opt.id)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${formData.features.includes(opt.id) ? 'bg-primary/10 border-primary text-primary dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent text-slate-500'}`}
                                            >
                                                {opt.icon}
                                                <span className="truncate">{opt.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <button
                            type="button"
                            onClick={nextStep}
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            Preview Details
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 fade-in">
                        <div className="space-y-4">
                            <div className="relative h-64 rounded-3xl overflow-hidden shadow-xl">
                                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-2 inline-block shadow-lg">
                                        {formData.type}
                                    </span>
                                    <h2 className="text-xl font-black text-white uppercase truncate">{formData.title}</h2>
                                </div>
                            </div>
                            
                            {formData.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {formData.images.map((url, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`size-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${formData.imageUrl === url ? 'border-primary scale-105' : 'border-transparent opacity-60'}`}
                                            onClick={() => setFormData(prev => ({ ...prev, imageUrl: url, image_url: url }))}
                                        >
                                            <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Section title="Everything Looks Good?" icon={<CheckCircle size={20} />}>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <PreviewInfo label="Rent" value={`৳${formData.rent}/${formData.billingCycle}`} />
                                <PreviewInfo label="Location" value={`${formData.upazila}, ${formData.district}`} />
                                <PreviewInfo label="Specs" value={`${formData.beds}B / ${formData.baths}Bath`} />
                                <PreviewInfo label="Size" value={formData.area ? `${formData.area} Sqft` : 'N/A'} />
                                <PreviewInfo label="Utilities Cost" value={`৳${formData.utilitiesCost || 0}`} />
                                <PreviewInfo label="Security" value={`৳${formData.securityDeposit || 0}`} />
                            </div>
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 leading-none">Full Address</p>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200 mb-3">{formData.addressDetails || 'Not specified'}, {formData.upazila}, {formData.district}, {formData.division}</p>
                                <p className="text-xs text-slate-400 font-bold leading-relaxed">{formData.description}</p>
                            </div>
                        </Section>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleProceedToPayment}
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            <CreditCard size={20} />
                            Publish Ad — ৳0 (Free)
                        </button>

                        <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
                            Limited time discount applied · Free listing
                        </p>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary dark:text-indigo-400 transition-colors mt-2"
                        >
                            Wait, go back and edit
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={publishConfirmOpen}
                title="Confirm Free Listing"
                message={`You are about to publish "${formData.title}" using our limited time free listing discount. Your listing will go live after our team verifies it.`}
                confirmText="Claim & Publish"
                confirmColor="#1a227f"
                variant="info"
                icon={CreditCard}
                onConfirm={() => {
                    setPublishConfirmOpen(false);
                    setPaymentModalOpen(true);
                }}
                onCancel={() => setPublishConfirmOpen(false)}
            />

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                type="listing_fee"
                amount={0}
                title="Listing Fee"
                subtitle={`Publish: ${formData.title}`}
                breakdownItems={[
                    { label: 'Property Listing Fee', amount: 49 },
                    { label: 'Limited Time Discount', amount: -49 },
                ]}
                propertyName={formData.title}
                onPaymentSubmitted={handlePaymentSubmitted}
            />
        </div>
    );
}

function Section({ title, icon, children }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary dark:text-indigo-400">
                {icon}
                <h3 className="font-black uppercase text-xs tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">{label}</label>
            <input
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl py-3 px-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                {...props}
            />
        </div>
    );
}

function PreviewInfo({ label, value }) {
    return (
        <div>
            <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.1em]">{label}</p>
            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{value}</p>
        </div>
    );
}

function Select({ label, children, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">{label}</label>
            <div className="relative">
                <select
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl py-3 px-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none disabled:opacity-50"
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={16} />
                </div>
            </div>
        </div>
    );
}

function Textarea({ label, ...props }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">{label}</label>
            <textarea
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl py-3 px-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all h-32"
                {...props}
            />
        </div>
    );
}

function ChevronDown({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
    )
}
