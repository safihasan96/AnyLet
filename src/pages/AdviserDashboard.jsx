import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import AddProperty from './AddProperty';
import ConfirmationModal from '../components/ConfirmationModal';
import './Dashboard.css';

export default function AdviserDashboard() {
    const { currentUser } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddProperty, setShowAddProperty] = useState(false);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        propertyId: null,
        isLoading: false,
        isSuccess: false
    });

    const fetchMyListings = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const q = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            const listingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setListings(listingsData);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyListings();
    }, [currentUser]);

    const handleConfirmDelete = async () => {
        const id = deleteModal.propertyId;
        if (!id) return;

        setDeleteModal(prev => ({ ...prev, isLoading: true }));
        try {
            await deleteDoc(doc(db, "properties", id));
            setListings(listings.filter(listing => listing.id !== id));
            setDeleteModal(prev => ({ ...prev, isLoading: false, isSuccess: true }));
            setTimeout(() => {
                setDeleteModal({ isOpen: false, propertyId: null, isLoading: false, isSuccess: false });
            }, 1000);
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete listing.");
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    return (
        <div className="dashboard-page container">
            <div className="dashboard-header">
                <h1>Adviser Dashboard</h1>
                <p>Manage your properties and new listings</p>
                {!showAddProperty && (
                    <button className="btn btn-primary mt-md" onClick={() => setShowAddProperty(true)}>
                        + Post a New Property
                    </button>
                )}
            </div>

            <div className="dashboard-content">
                {showAddProperty ? (
                    <AddProperty
                        onSuccess={() => {
                            setShowAddProperty(false);
                            fetchMyListings();
                        }}
                        onCancel={() => setShowAddProperty(false)}
                    />
                ) : (
                    <>
                        <h2>My Listings</h2>
                        {loading ? (
                            <div className="loading-state">Loading your properties...</div>
                        ) : listings.length > 0 ? (
                            <div className="properties-grid">
                                {listings.map(property => (
                                    <div key={property.id} className="adviser-card-wrapper">
                                        <PropertyCard property={property} />
                                        <div className="adviser-card-actions glass-panel">
                                            <button className="btn btn-outline small-btn">Edit</button>
                                            <button
                                                className="btn btn-outline small-btn"
                                                style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }}
                                                onClick={() => setDeleteModal({ isOpen: true, propertyId: property.id, isLoading: false, isSuccess: false })}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data glass-panel">
                                <p>You haven't posted any properties yet.</p>
                                <button className="btn btn-primary mt-md" onClick={() => setShowAddProperty(true)}>
                                    Post your first property
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                isSuccess={deleteModal.isSuccess}
                isLoading={deleteModal.isLoading}
                title="Delete Listing?"
                message="Are you sure you want to permanently delete this listing? This action cannot be undone."
                confirmText="Yes, Delete"
                confirmColor="#ef4444"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, propertyId: null, isLoading: false, isSuccess: false })}
            />
        </div>
    );
}
