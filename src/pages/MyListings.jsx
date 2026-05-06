import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MoreHorizontal, MapPin, ChevronRight, Home as HomeIcon, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

export default function MyListings() {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const listingsQuery = query(collection(db, 'properties'));
        const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
            const userListings = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        image: data.image || data.imageUrl || (data.images && data.images[0])
                    };
                })
                .filter(item => (
                    item.ownerId === user.uid ||
                    item.landlordId === user.uid ||
                    item.userId === user.uid ||
                    item.creatorId === user.uid
                ))
                .sort((a, b) => {
                    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
            setListings(userListings);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, navigate]);

    const handleDeleteClick = (e, property) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, id: property.id, title: property.title });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'properties', deleteModal.id));
            setDeleteModal({ isOpen: false, id: null, title: '' });
        } catch (error) {
            console.error("Error deleting property:", error);
            alert("Failed to delete property. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-28">
            <header className="flex items-center px-6 pt-10 pb-6 sticky top-0 bg-[#f8fafc]/95 dark:bg-slate-950/95 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <h1 className="flex-1 text-center text-[20px] font-[900] text-slate-900 dark:text-white tracking-tight">My Listings</h1>
                <button className="p-2 -mr-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <MoreHorizontal size={24} strokeWidth={2.5} />
                </button>
            </header>

            <main className="flex-1 px-6 pt-6">
                {loading ? (
                    <div className="flex flex-col gap-5">
                        {[1, 2, 3].map(n => <div key={n} className="animate-pulse h-[110px] w-full rounded-[24px] bg-[#e2e8f0] dark:bg-slate-800" />)}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {listings.map(property => (
                            <ListingCard 
                                key={property.id} 
                                property={property} 
                                onClick={() => navigate(`/property/${property.id}`)} 
                                onDelete={(e) => handleDeleteClick(e, property)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="size-20 bg-[#e0e7ff] dark:bg-slate-800 rounded-full flex items-center justify-center text-[#3730a3] dark:text-indigo-400 mb-6 relative">
                            <HomeIcon size={32} strokeWidth={2.5} />
                            <div className="absolute -top-1 -right-1 size-6 bg-[#3730a3] text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#f8fafc] dark:border-slate-950">
                                0
                            </div>
                        </div>
                        <h3 className="text-[19px] font-[900] text-slate-900 dark:text-white mb-2">No Properties Listed</h3>
                        <p className="text-[#64748b] text-[15px] font-medium leading-relaxed mb-8 max-w-[280px]">
                            You haven't added any properties yet. Post your first ad to get started.
                        </p>
                        <button
                            onClick={() => navigate('/post-ad')}
                            className="bg-[#3730a3] text-white font-[800] text-[15px] py-4 px-8 rounded-full shadow-lg shadow-[#3730a3]/20 transition-transform active:scale-95"
                        >
                            Post New Ad
                        </button>
                    </div>
                )}
            </main>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Listing?"
                message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="#ef4444"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: null, title: '' })}
            />
        </div>
    );
}

function ListingCard({ property, onClick, onDelete }) {
    const { title, rent, area, district, upazila, image } = property;

    const displayRent = rent || property.price || 0;
    const displayImage = image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';
    const displayLocation = upazila || area || district || 'City Area';

    return (
        <div 
            onClick={onClick} 
            className="w-full group flex items-center bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800/80 transition-all hover:shadow-xl hover:shadow-[#3730a3]/5 active:scale-[0.98] p-3 gap-4 text-left cursor-pointer"
        >
            <div className="size-[88px] shrink-0 overflow-hidden rounded-[20px]">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={displayImage} alt={title || 'Listing'} />
            </div>

            <div className="flex-1 min-w-0 pr-1 py-1 flex flex-col justify-center">
                <h4 className="font-[800] text-[16px] text-slate-900 dark:text-white leading-tight truncate mb-1">
                    {title || 'Property Title'}
                </h4>

                <div className="flex items-center gap-1.5 text-[#64748b] dark:text-slate-400 text-[13px] mb-2 truncate">
                    <MapPin size={14} className="shrink-0" strokeWidth={2.5} />
                    <span className="font-[600] truncate">{displayLocation}</span>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="font-[900] text-[17px] text-[#3730a3] dark:text-indigo-400">
                        ৳{displayRent.toLocaleString()}
                    </span>
                    <span className="text-[12px] font-bold text-[#64748b] dark:text-slate-400">
                        / month
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button 
                    onClick={onDelete}
                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                >
                    <Trash2 size={18} strokeWidth={2.5} />
                </button>
                <div className="pr-3 pl-1 text-[#94a3b8] dark:text-slate-500 group-hover:text-[#3730a3] dark:group-hover:text-indigo-400 transition-colors">
                    <ChevronRight size={20} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
}
