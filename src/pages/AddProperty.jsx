'use client';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import DOMPurify from 'dompurify';
import { bdLocations } from '../data/locations';
import { ArrowLeft, ArrowRight, CheckCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationPickerMap from '../components/LocationPickerMap';
import { useToast } from '../contexts/ToastContext';
import { createNotification } from '../utils/notificationService';
import logger from '../utils/logger';
import useImageUpload from '../hooks/useImageUpload';
import StepBasics from '../components/add-property/StepBasics';
import StepDetails from '../components/add-property/StepDetails';
import StepPreview from '../components/add-property/StepPreview';

export default function AddProperty() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

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
    }, [currentUser?.uid, userProfile, navigate, toast]);

    const [showPhoneModal, setShowPhoneModal] = useState(false);

    const { uploading, uploadImages } = useImageUpload();
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
        images: [],
        securityDeposit: '',
        utilitiesCost: '',
        billingCycle: 'Month',
        utilities: [],
        features: [],
        lat: null,
        lng: null,
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'division') {
            setFormData(prev => ({ ...prev, division: value, district: '', upazila: '' }));
        } else if (name === 'district') {
            setFormData(prev => ({ ...prev, district: value, upazila: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

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

        const uploadedUrls = await uploadImages(files);
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

    // Called by StepBasics when user drag-reorders images
    const handleReorderImages = (newOrder) => {
        setFormData(prev => ({
            ...prev,
            images: newOrder,
            imageUrl: newOrder[0] || '',
            image_url: newOrder[0] || ''
        }));
    };

    // Direct publish — no payment required
    const handlePublish = async () => {
        if (!currentUser) return;

        const rent = Number(formData.rent);
        const beds = Number(formData.beds);
        const baths = Number(formData.baths);
        const area = formData.area ? Number(formData.area) : null;
        const securityDeposit = formData.securityDeposit ? Math.round(Number(formData.securityDeposit)) : 0;
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
                ownerName: userProfile?.displayName || userProfile?.name || currentUser.displayName || '',
                ownerPhotoURL: userProfile?.photoURL || currentUser.photoURL || '',
                isApproved: false,
                listingPaymentId: null,
                isOnsiteVerified: false,
                verificationPaymentId: null,
                verificationStatus: 'none',
                onsiteVerificationRequested: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'Pending',
                expiryEmailSent: false
            };

            await addDoc(collection(db, 'properties'), propertyData);

            await createNotification(
                currentUser.uid,
                'system',
                'Listing Submitted',
                `Your property "${formData.title}" has been submitted for review. It will go live once our team verifies it — usually under 30 minutes.`,
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

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0F1117] pb-32 text-slate-900 dark:text-slate-100">
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-[#0F1117]/90 backdrop-blur-xl px-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-[#1A1D24] p-10 rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/[0.06] text-center max-w-sm w-full"
                        >
                            <div className="size-24 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-primary/20">
                                <CheckCircle size={48} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Listing Submitted!</h2>
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

            {createPortal(
                <AnimatePresence>
                    {showPhoneModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-white dark:bg-[#1A1D24] p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/[0.06] text-center max-w-sm w-full"
                            >
                                <div className="size-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                                    <Phone size={36} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Phone Number Required</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm">
                                    To protect our community and ensure secure communications, we require all owners to verify their phone number before posting properties.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate('/edit-profile')}
                                        className="w-full bg-[#1a227f] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#121966] transition-all active:scale-95 shadow-xl shadow-[#1a227f]/20 flex justify-center items-center gap-2"
                                    >
                                        Add Phone Number <ArrowRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full py-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm transition-colors"
                                    >
                                        Back to Home
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <header className="flex items-center px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] justify-between sticky top-0 z-50 bg-white/80 dark:bg-[#1A1D24]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06]">
                <button onClick={prevStep} className="text-slate-700 dark:text-slate-300 p-2">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-black uppercase tracking-tight">Post Property</h1>
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-primary' : 'bg-slate-200 dark:bg-white/[0.06]'}`} />
                        ))}
                    </div>
                </div>
                <div className="w-10" />
            </header>

            <div className="p-5 max-w-2xl mx-auto w-full">
                {step === 1 && (
                    <StepBasics
                        formData={formData}
                        setFormData={setFormData}
                        onChange={handleChange}
                        onImageUpload={handleImageUpload}
                        onRemoveImage={removeImage}
                        onReorderImages={handleReorderImages}
                        uploading={uploading}
                        onNext={nextStep}
                        divisions={divisions}
                        districts={districts}
                        thanas={thanas}
                    />
                )}

                {step === 2 && (
                    <StepDetails
                        formData={formData}
                        onChange={handleChange}
                        onDistanceChange={handleDistanceChange}
                        toggleItem={toggleItem}
                        onNext={nextStep}
                    />
                )}

                {step === 3 && (
                    <StepPreview
                        formData={formData}
                        setFormData={setFormData}
                        loading={loading}
                        onPublish={handlePublish}
                        onBack={() => setStep(2)}
                    />
                )}
            </div>
        </div>
    );
}
