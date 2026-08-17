'use client';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';


import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';
import { bdLocations } from '../data/locations';
import {
    ArrowLeft, ArrowRight, Building2, MapPin, Info, Image as ImageIcon,
    CheckCircle, Flame, Zap, Droplets, Wifi, Trash2, Battery,
    ShieldCheck, Car, Wind, Lock, DoorOpen, ChevronsUp, Phone, Camera,
    CloudSun, UtensilsCrossed, Thermometer, Package, Bike, Calendar, Users,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import LocationPickerMap from '../components/LocationPickerMap';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';
import { compressImage } from '../utils/imageUtils';
import { useFees } from '../hooks/useFees';
import { Card, Button, Input, Select, Textarea, Field, Icon, Badge, Checkbox, Radio, RadioGroup, Modal, ModalFooter } from '../components/ui';

export default function AddProperty() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { fees, loading: feesLoading } = useFees();

    useEffect(() => {
        // Wait until auth and profile are fully loaded
        if (!currentUser || !userProfile) return;

        if (!currentUser.emailVerified) {
            toast.warning("Please verify your email address to post a property.");
            navigate('/');
            return;
        }

        const hasPhone = userProfile?.personalDetails?.phoneNumber?.trim() ||
                         userProfile?.phoneNumber?.trim() ||
                         userProfile?.phone?.trim();

        if (!hasPhone) {
            setShowPhoneModal(true);
        } else {
            setShowPhoneModal(false);
        }
    }, [currentUser, currentUser?.uid, userProfile, navigate, toast]);

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [wantOnsiteVerify, setWantOnsiteVerify] = useState(false);

    // Check if user has an active paid subscription
    const subscriptionPlan = userProfile?.subscriptionPlan;
    const subscriptionExpiry = userProfile?.subscriptionExpiry;
    const hasActiveSubscription = !!(
        subscriptionPlan &&
        subscriptionExpiry &&
        new Date(subscriptionExpiry?.toDate ? subscriptionExpiry.toDate() : subscriptionExpiry) > new Date()
    );

    // Pricing constants
    const LISTING_FEE = hasActiveSubscription ? 0 : Number(fees.listingFee.value);
    const ONSITE_FEE = Number(fees.onsiteVerificationFee.value);
    const totalAmount = LISTING_FEE + (wantOnsiteVerify ? ONSITE_FEE : 0);

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
        verandas: '0',
        instantBooking: false,
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
        lng: null,
        // BD-specific fields
        gasSupply: 'Cylinder',
        electricityBilling: 'Excluded',
        waterSource: 'WASA',
        facing: '',
        floorNumber: '',
        parkingType: 'None',
        petPolicy: 'Not Allowed',
        bachelorPolicy: 'Not Allowed',
        familyPolicy: 'Family Only',
        distances: {
            mosque: '',
            school: '',
            market: ''
        },
        agentCommission: ''
    });

    const [showSuccess, setShowSuccess] = useState(false);

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

    // Numeric-only fields: strip everything except digits
    const NUMERIC_FIELDS = new Set(['rent', 'securityDeposit', 'utilitiesCost', 'area', 'agentCommission', 'floorNumber', 'beds', 'baths', 'verandas']);

    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        // For currency / numeric text fields, strip non-digit characters so the
        // browser's number-parsing engine never touches the raw string.
        if (NUMERIC_FIELDS.has(name)) {
            value = value.replace(/[^0-9]/g, '');
        }

        // Custom logic for cascading resets
        if (name === 'division') {
            setFormData(prev => ({ ...prev, division: value, district: '', upazila: '' }));
        } else if (name === 'district') {
            setFormData(prev => ({ ...prev, district: value, upazila: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Retained for BD-specific field sections (distances, utilities, features)
    // eslint-disable-next-line no-unused-vars
    const handleDistanceChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            distances: {
                ...prev.distances,
                [name]: value
            }
        }));
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

        if (formData.images.length + files.length > 5) {
            toast.warning("You can only upload up to 5 images in total.");
            return;
        }

        setLoading(true);
        const uploadedUrls = [];

        // Determine which upload strategy to use:
        // 1. Signed upload via our API (preferred — keeps secrets server-side)
        // 2. Unsigned upload via preset (fallback for local dev / if API misconfigured)
        let sigData = null;
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        try {
            const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await currentUser.getIdToken()}`,
                },
                body: JSON.stringify({ isKyc: false })
            });
            if (sigRes.ok) {
                sigData = await sigRes.json();
                // Validate the response has everything we need
                if (!sigData?.signature || !sigData?.apiKey || !sigData?.cloudName) {
                    logger.warn('[Upload] Signed response incomplete, falling back to unsigned preset.');
                    sigData = null;
                }
            } else {
                const errBody = await sigRes.json().catch(() => ({}));
                logger.warn('[Upload] Signed endpoint failed:', errBody?.error || sigRes.status, '— using unsigned preset fallback.');
            }
        } catch (sigError) {
            logger.warn('[Upload] Could not reach sign endpoint:', sigError.message, '— using unsigned preset fallback.');
        }

        // Abort if neither strategy is available
        if (!sigData && (!cloudName || !uploadPreset)) {
            toast.error('Image upload is not configured. Please contact support.');
            setLoading(false);
            return;
        }

        try {
            for (const rawFile of files) {
                // --- Client-side compression (Canvas API, zero deps) ---
                let file = rawFile;
                try {
                    file = await compressImage(rawFile, { maxWidth: 1280, quality: 0.82, maxSizeKB: 800 });
                    logger.info(`[Upload] Compressed ${rawFile.name}: ${(rawFile.size/1024).toFixed(0)}KB → ${(file.size/1024).toFixed(0)}KB`);
                } catch (compressErr) {
                    logger.warn('[Upload] Compression failed, uploading original:', compressErr.message);
                    file = rawFile; // fall back to original
                }

                const data = new FormData();
                data.append('file', file);

                let uploadUrl;
                if (sigData) {
                    // Signed upload
                    data.append('api_key', sigData.apiKey);
                    data.append('timestamp', sigData.timestamp);
                    data.append('signature', sigData.signature);
                    data.append('folder', sigData.folder);
                    uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
                } else {
                    // Unsigned upload (uses public preset)
                    data.append('upload_preset', uploadPreset);
                    uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for large files

                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    body: data,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const fileData = await res.json();

                if (!res.ok) {
                    logger.error('[Upload] Cloudinary error:', fileData);
                    toast.error(`Upload failed: ${fileData.error?.message || 'Unknown error'}`);
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
                        imageUrl: newImages[0],
                        image_url: newImages[0]
                    };
                });
                toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} uploaded!`);
            }
        } catch (error) {
            logger.error('[Upload] Process error:', error);
            if (error.name === 'AbortError') {
                toast.error('Upload timed out. Please check your connection and try again.');
            } else if (!error.message?.includes('Upload failed')) {
                toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReorderImages = (newOrder) => {
        setFormData(prev => ({
            ...prev,
            images: newOrder,
            imageUrl: newOrder[0] || '',
            image_url: newOrder[0] || ''
        }));
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

    const handlePublish = async () => {
        if (!currentUser) return;
        
        const rent = Number(formData.rent);
        const beds = Number(formData.beds);
        const baths = Number(formData.baths);
        const area = formData.area ? Number(formData.area) : null;
        const securityDeposit = formData.securityDeposit ? Number(formData.securityDeposit) : 0;
        const utilitiesCost = Number(formData.utilitiesCost) || 0;

        if (Number.isNaN(rent) || rent <= 0) {
            toast.error('Please enter a valid rent amount.');
            return;
        }
        if (Number.isNaN(beds) || beds < 0 || Number.isNaN(baths) || baths < 0) {
            toast.error('Please enter valid numbers for beds and baths.');
            return;
        }

        setLoading(true);

        try {
            const cleanTitle = DOMPurify.sanitize(formData.title, { ALLOWED_TAGS: [] });
            const cleanDescription = DOMPurify.sanitize(formData.description, { ALLOWED_TAGS: [] });

            const propertyData = {
                ...formData,
                title: cleanTitle,
                description: cleanDescription,
                rent,
                area,
                beds,
                baths,
                verandas: Number(formData.verandas) || 0,
                securityDeposit,
                utilitiesCost,
                ownerId: currentUser.uid,
                isApproved: false,
                listingPaymentId: null,
                // If user requested onsite verification, mark it as pending
                isOnsiteVerified: false,
                verificationPaymentId: null,
                verificationStatus: wantOnsiteVerify ? 'pending' : 'none',
                onsiteVerificationRequested: wantOnsiteVerify,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'Pending',
                expiryEmailSent: false
            };

            await addDoc(collection(db, 'properties'), propertyData);

            // Notify the owner that listing was submitted
            const notifMsg = wantOnsiteVerify
                ? `Your property "${formData.title}" has been submitted with an on-site verification request. Our team will contact you soon.`
                : `Your property "${formData.title}" has been submitted for review. It will go live once our team verifies it — usually under 30 minutes.`;

            await createNotification(
                currentUser.uid,
                'system',
                'Listing Submitted',
                notifMsg,
                '/my-listings'
            );

            setShowSuccess(true);
            setTimeout(() => navigate('/'), 4000);
        } catch (err) {
            logger.error(err);
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



    if (feesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0F1117]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-surface-sunken pb-32">
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/90 backdrop-blur-xl px-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-surface p-10 rounded-modal shadow-modal border border-border text-center max-w-sm w-full"
                        >
                            <div className="size-24 bg-success/20 rounded-full flex items-center justify-center text-success mx-auto mb-8 shadow-xl shadow-success/20 border border-success/30">
                                <CheckCircle size={48} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-title-xl text-content mb-4">Ad Submitted!</h2>
                            <p className="text-muted font-bold mb-10 leading-relaxed text-body-md">
                                Your listing is being verified — usually takes under 30 minutes. Redirecting you home...
                            </p>
                            <Button 
                                size="lg"
                                fullWidth
                                onClick={() => navigate('/')}
                            >
                                Take me Home
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <Modal open={showPhoneModal} onClose={() => {}} showClose={false} size="md">
                <div className="text-center p-4">
                    <div className="size-20 bg-danger-subtle rounded-full flex items-center justify-center text-danger mx-auto mb-6">
                        <Phone size={36} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-title-lg text-content mb-3">Phone Number Required</h2>
                    <p className="text-muted font-medium mb-8 text-body-sm">
                        To protect our community and ensure secure communications, we require all owners to verify their phone number before posting properties.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        <Button 
                            size="lg"
                            fullWidth
                            onClick={() => navigate('/edit-profile')}
                            rightIcon={<ArrowRight size={16} />}
                        >
                            Add Phone Number
                        </Button>
                        <Button 
                            variant="ghost"
                            size="lg"
                            fullWidth
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <header className="flex items-center px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] justify-between sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
                <button onClick={prevStep} className="text-muted hover:text-content p-2 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-title-sm uppercase tracking-tight text-content">Post Property</h1>
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-primary' : 'bg-surface-raised border border-border'}`} />
                        ))}
                    </div>
                </div>
                <div className="w-10" />
            </header>

            <div className="p-5 max-w-2xl mx-auto w-full space-y-6">
                {step === 1 && (
                    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card padding="lg" className="space-y-6">
                            <div className="flex items-center gap-2 text-primary pb-4 border-b border-border">
                                <Building2 size={20} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Basic Details</h3>
                            </div>
                            
                            <Field label="Property Title" required>
                                <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Modern Flat in Gulshan" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Property Type" required>
                                    <Select name="type" value={formData.type} onChange={handleChange}>
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </Field>
                                <Field label="Rent (৳)" required>
                                    <Input name="rent" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.rent} onChange={handleChange} placeholder="25000" />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Billing Cycle" hintIcon={<Calendar size={12} />}>
                                    <Select name="billingCycle" value={formData.billingCycle} onChange={handleChange}>
                                        {BILLING_CYCLES.map(cycle => <option key={cycle} value={cycle}>{cycle}</option>)}
                                    </Select>
                                </Field>

                                <Field label="Tenant Type" hintIcon={<Users size={12} />}>
                                    <Select name="tenantType" value={formData.tenantType} onChange={handleChange}>
                                        {TENANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </Field>
                            </div>
                        </Card>

                        <Card padding="lg" className="space-y-6">
                            <div className="flex items-center gap-2 text-primary pb-4 border-b border-border">
                                <MapPin size={20} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Location Setup</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Division" required>
                                    <Select name="division" value={formData.division} onChange={handleChange}>
                                        <option value="">Select Division</option>
                                        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                </Field>
                                <Field label="District" required>
                                    <Select name="district" value={formData.district} onChange={handleChange} disabled={!formData.division}>
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Thana / Upazila" required>
                                    <Select name="upazila" value={formData.upazila} onChange={handleChange} disabled={!formData.district}>
                                        <option value="">Select Thana</option>
                                        {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </Field>
                                <Field label="House/Road No. (Details)">
                                    <Input name="addressDetails" value={formData.addressDetails} onChange={handleChange} placeholder="e.g. House 5, Road 10" />
                                </Field>
                            </div>
                            
                            <div className="pt-2">
                                <label className="text-caption font-bold text-muted uppercase tracking-widest block mb-2">Pin Exact Location on Map</label>
                                <div className="rounded-card overflow-hidden border border-border shadow-sm">
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
                        </Card>

                        <Button size="lg" fullWidth onClick={nextStep} rightIcon={<ArrowRight size={18} />}>
                            Continue to Details
                        </Button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card padding="lg" className="space-y-6">
                            <div className="flex items-center gap-2 text-primary pb-4 border-b border-border">
                                <Info size={20} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Specifications & Utilities</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Field label="Beds">
                                    <Input name="beds" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.beds} onChange={handleChange} />
                                </Field>
                                <Field label="Baths">
                                    <Input name="baths" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.baths} onChange={handleChange} />
                                </Field>
                                <Field label="Verandas">
                                    <Input name="verandas" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.verandas} onChange={handleChange} />
                                </Field>
                                <Field label="SqFt (Optional)">
                                    <Input name="area" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.area} onChange={handleChange} placeholder="N/A" />
                                </Field>
                            </div>

                            <Card variant="sunken" className="flex items-center justify-between !p-4 border-primary/20 bg-primary-subtle/50">
                                <div className="flex-1 pr-4">
                                    <h4 className="text-body-sm font-bold text-primary">Instant Booking</h4>
                                    <p className="text-caption font-medium text-primary/70 mt-1 leading-relaxed">If enabled, a "Book Now" button will appear on your listing. You can set up the required deposit amount in your dashboard later.</p>
                                </div>
                                <div className="w-24">
                                    <Select name="instantBooking" value={formData.instantBooking ? 'Yes' : 'No'} onChange={(e) => setFormData(prev => ({ ...prev, instantBooking: e.target.value === 'Yes' }))}>
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </Select>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 gap-4">
                                <Field label="Security Deposit (Optional)">
                                    <Input name="securityDeposit" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.securityDeposit} onChange={handleChange} placeholder="0" />
                                </Field>
                            </div>
                            
                            <Field label="Description">
                                <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell tenants about your space..." rows={4} />
                            </Field>
                        </Card>

                        {/* NEW AMENITIES & UTILITIES CARD */}
                        <Card padding="lg" className="space-y-6">
                            <div className="flex items-center gap-2 text-primary pb-4 border-b border-border">
                                <Info size={20} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Amenities & Utilities</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-muted ml-1 tracking-widest">Included Utilities</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                        {UTILITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleItem('utilities', opt.id)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border text-caption font-bold transition-all text-left ${formData.utilities.includes(opt.id) ? 'bg-primary-subtle border-primary text-primary' : 'bg-surface-sunken border-transparent hover:border-border text-muted hover:text-content'}`}
                                            >
                                                {opt.icon}
                                                <span className="truncate">{opt.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Field label="Monthly Utilities Cost (৳)" required>
                                    <Input name="utilitiesCost" type="text" inputMode="numeric" pattern="[0-9]*" value={formData.utilitiesCost} onChange={handleChange} placeholder="e.g. 2000" />
                                </Field>

                                <div>
                                    <label className="text-[10px] uppercase font-black text-muted ml-1 tracking-widest">Property Features & Amenities</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                        {FEATURE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => toggleItem('features', opt.id)}
                                                className={`flex items-center gap-2 p-3 rounded-xl border text-caption font-bold transition-all text-left ${formData.features.includes(opt.id) ? 'bg-primary-subtle border-primary text-primary' : 'bg-surface-sunken border-transparent hover:border-border text-muted hover:text-content'}`}
                                            >
                                                {opt.icon}
                                                <span className="truncate">{opt.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card padding="lg" className="space-y-6">
                            <div className="flex items-center gap-2 text-primary pb-4 border-b border-border">
                                <ImageIcon size={20} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Media (Up to 5 images)</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <Reorder.Group 
                                    axis="y" 
                                    values={formData.images} 
                                    onReorder={handleReorderImages} 
                                    className="contents" 
                                    as="div"
                                >
                                    {formData.images.map((url, index) => (
                                        <Reorder.Item 
                                            key={url} 
                                            value={url} 
                                            className="relative aspect-square rounded-control overflow-hidden group border border-border shadow-sm cursor-grab active:cursor-grabbing"
                                        >
                                            <img loading="lazy" src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover pointer-events-none select-none" />
                                            <button 
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-danger text-white rounded-control opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-0 inset-x-0 bg-primary/80 backdrop-blur-sm py-1 text-[8px] font-black text-white text-center uppercase tracking-widest z-10 pointer-events-none">
                                                    Main Cover
                                                </div>
                                            )}
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                                
                                {formData.images.length < 5 && (
                                    <div className="relative aspect-square">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={handleImageUpload} 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={loading}
                                        />
                                        <Card variant="sunken" className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-dashed border-2 border-border hover:border-primary/50 transition-colors">
                                            {loading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-caption font-bold text-primary">Uploading...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="size-10 bg-primary-subtle text-primary rounded-full flex items-center justify-center">
                                                        <Camera size={20} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-caption font-bold text-content">Add Photos</p>
                                                        <p className="text-[9px] text-muted">{5 - formData.images.length} remaining</p>
                                                    </div>
                                                </>
                                            )}
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="flex gap-3">
                            <Button variant="outline" size="lg" onClick={prevStep}>
                                Back
                            </Button>
                            <Button size="lg" className="flex-1" onClick={nextStep} rightIcon={<ArrowRight size={18} />}>
                                Review & Publish
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card padding="lg" className="space-y-6">
                            <div className="flex items-center gap-2 text-primary pb-4 border-b border-border">
                                <CheckCircle size={20} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Everything Looks Good?</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest">Rent</p>
                                    <p className="font-bold text-content uppercase tracking-tight">৳{formData.rent}/{formData.billingCycle}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest">Location</p>
                                    <p className="font-bold text-content uppercase tracking-tight">{formData.upazila}, {formData.district}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest">Specs</p>
                                    <p className="font-bold text-content uppercase tracking-tight">{formData.beds}B / {formData.baths}Bath</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest">Size</p>
                                    <p className="font-bold text-content uppercase tracking-tight">{formData.area ? `${formData.area} Sqft` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest">Utilities Cost</p>
                                    <p className="font-bold text-content uppercase tracking-tight">৳{formData.utilitiesCost || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted tracking-widest">Security</p>
                                    <p className="font-bold text-content uppercase tracking-tight">৳{formData.securityDeposit || 0}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border space-y-3">
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 leading-none">Full Address</p>
                                <p className="text-body-sm font-bold text-content mb-3">{formData.addressDetails || 'Not specified'}, {formData.upazila}, {formData.district}, {formData.division}</p>
                                <p className="text-caption text-muted font-medium leading-relaxed">{formData.description}</p>
                                {formData.utilities.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Included Utilities</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.utilities.map(u => (
                                                <span key={u} className="text-caption font-bold bg-primary-subtle text-primary px-2 py-0.5 rounded-full">{u}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {formData.features.length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Features & Amenities</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.features.map(f => (
                                                <span key={f} className="text-caption font-bold bg-surface-sunken border border-border text-content px-2 py-0.5 rounded-full">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Active Subscription Banner */}
                        {hasActiveSubscription && (
                            <Card variant="sunken" className="flex items-center gap-3 border-success/30 bg-success/10 !p-4">
                                <CheckCircle size={20} className="text-success shrink-0" />
                                <div>
                                    <p className="font-bold text-success text-body-sm">{subscriptionPlan} Plan Active</p>
                                    <p className="text-caption font-medium text-success/80">Listing fee included in your subscription — post for free!</p>
                                </div>
                            </Card>
                        )}

                        {/* On-Site Verification Add-On */}
                        <Card 
                            variant="sunken"
                            className={`flex items-start gap-4 cursor-pointer transition-all ${
                                wantOnsiteVerify
                                    ? 'border-primary bg-primary-subtle'
                                    : 'border-border hover:border-primary/40'
                            }`}
                            onClick={() => setWantOnsiteVerify(v => !v)}
                        >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                wantOnsiteVerify ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                                {wantOnsiteVerify && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-content text-body-sm">Add On-Site Verification</p>
                                    <span className="text-caption font-bold text-primary">+ ৳{ONSITE_FEE}</span>
                                </div>
                                <p className="text-caption font-medium text-muted mt-1 leading-relaxed">
                                    Our team visits your property, verifies it, and adds a <Badge variant="success" size="sm" className="ml-1 mr-1">Verified</Badge> badge — boosting trust with tenants.
                                </p>
                            </div>
                        </Card>

                        <Button
                            size="lg"
                            fullWidth
                            disabled={loading}
                            onClick={handlePublish}
                            leftIcon={<CheckCircle size={20} />}
                        >
                            Publish Ad
                        </Button>

                        <p className="text-center text-[10px] font-bold text-muted mt-2">
                            Posting an ad is completely free!
                            {wantOnsiteVerify && ` (On-Site Verify: ৳${ONSITE_FEE} payable later)`}
                        </p>

                        <Button
                            variant="ghost"
                            fullWidth
                            className="mt-2 text-muted"
                            onClick={() => setStep(2)}
                        >
                            Wait, go back and edit
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
