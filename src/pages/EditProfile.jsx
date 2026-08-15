import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { EditProfileSkeleton } from '../components/Skeleton';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';
import Container from '../components/layout/Container';
import { Card, Button, Input, Field, Avatar, IconButton, Icon, useToast } from '../components/ui';

export default function EditProfile() {
    const { currentUser, refreshUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
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
                        phone: data.phone || '',
                        whatsappNumber: data.whatsappNumber || '',
                        location: data.location || '',
                        photoURL: data.photoURL || currentUser.photoURL || ''
                    });
                }
            } catch (err) {
                logger.error('Fetch user profile', err);
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
            toast.error('Mobile number must be exactly 11 digits.');
            return;
        } else if (!phoneStr) {
            toast.error('Mobile number is required.');
            return;
        }

        try {
            setSaving(true);
            const uid = currentUser?.uid || auth.currentUser?.uid;
            if (!uid) throw new Error("User session not found. Please log in again.");

            const userRef = doc(db, 'users', uid);
            const waDigits = formData.whatsappNumber ? formData.whatsappNumber.replace(/\D/g, '') : '';
            await setDoc(userRef, {
                fullName: formData.fullName,
                phone: phoneDigits,
                whatsappNumber: waDigits,
                location: formData.location,
                photoURL: formData.photoURL
            }, { merge: true });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { 
                    displayName: formData.fullName,
                    photoURL: formData.photoURL 
                });
            }

            if (refreshUser) await refreshUser();
            toast.success('Profile updated successfully!');
        } catch (err) {
            logger.error('Profile update error', err);
            toast.error(`Failed to update profile: ${err.message || err}`);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const sigRes = await fetch(getApiUrl('/api/cloudinary-sign'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
                },
                body: JSON.stringify({ isKyc: false })
            });
            const sigData = await sigRes.json();
            if (!sigRes.ok) throw new Error(sigData.error || 'Failed to generate secure upload signature.');
            
            const data = new FormData();
            data.append('file', file);
            data.append('api_key', sigData.apiKey);
            data.append('timestamp', sigData.timestamp);
            data.append('signature', sigData.signature);
            data.append('folder', sigData.folder);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
                method: 'POST',
                body: data
            });
            const fileData = await res.json();
            
            if (fileData.secure_url) {
                setFormData(prev => ({ ...prev, photoURL: fileData.secure_url }));
                toast.success('Photo uploaded! Don\'t forget to save changes.');
            } else {
                throw new Error(fileData.error?.message || "Unknown error");
            }
        } catch (err) {
            logger.error('Upload error', err);
            toast.error(err.message || 'Connection error during upload.');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <EditProfileSkeleton />;

    return (
        <div className="min-h-screen bg-bg pb-24">
            <Container size="narrow" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
                <header className="mb-6 flex items-center gap-3">
                    <IconButton variant="ghost" label="Go back" onClick={() => navigate('/profile')}>
                        <Icon name="arrowLeft" />
                    </IconButton>
                    <div>
                        <h1 className="font-display text-display-md text-content">Edit Profile</h1>
                        <p className="mt-1 text-body-sm text-muted">Update your personal details and photo.</p>
                    </div>
                </header>

                <Card padding="xl" className="mx-auto max-w-md">
                    <div className="mb-8 flex flex-col items-center">
                        <div className="relative mb-4">
                            <Avatar src={formData.photoURL} name={formData.fullName} size="2xl" ring />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                ref={fileInputRef}
                                id="profile-photo-upload"
                            />
                            <IconButton 
                                label="Upload photo" 
                                variant="primary"
                                className="absolute bottom-0 right-0 shadow-card"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                            >
                                <Icon name="camera" />
                            </IconButton>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? "Uploading..." : "Change Photo"}
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field label="Full Name" required>
                            <Input
                                type="text"
                                name="fullName"
                                placeholder="Anisur Rahman"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </Field>

                        <Field label="Email Address">
                            <Input
                                type="email"
                                name="email"
                                placeholder="anisur@example.com"
                                value={currentUser?.email || ''}
                                readOnly
                                disabled
                            />
                        </Field>

                        <Field label="Phone Number" required>
                            <Input
                                type="tel"
                                name="phone"
                                placeholder="01712345678"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Field>

                        <Field 
                            label="WhatsApp Number" 
                            helpText="Enables a 'Chat on WhatsApp' button on your listings."
                            optional
                        >
                            <Input
                                type="tel"
                                name="whatsappNumber"
                                placeholder="01812345678"
                                leftIcon={<Icon name="messages" />}
                                value={formData.whatsappNumber}
                                onChange={handleChange}
                            />
                        </Field>

                        <Field label="Location">
                            <Input
                                type="text"
                                name="location"
                                placeholder="Dhaka, Bangladesh"
                                leftIcon={<Icon name="location" />}
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </Field>

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                fullWidth 
                                disabled={saving}
                                leftIcon={<Icon name="check" />}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </Container>
        </div>
    );
}
