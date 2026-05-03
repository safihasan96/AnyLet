import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function UserDashboard() {
    const { currentUser } = useAuth();
    const [viewingRequests, setViewingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRequests() {
            if (!currentUser) return;
            try {
                // Since our ViewingRequests earlier didn't save UID directly initially (just name/phone),
                // we'll filter by the user's email or phone if we saved it globally. 
                // For a robust app, we should save `userId: currentUser.uid` in the viewing request.
                // Assuming we update the viewing request to store `userId: currentUser.uid`
                const q = query(collection(db, "viewing_requests"), where("tenantId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                const requestsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by date locally if createdAt exists
                requestsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setViewingRequests(requestsData);
            } catch (error) {
                console.error("Error fetching viewing requests:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRequests();
    }, [currentUser]);

    return (
        <div className="dashboard-page container">
            <div className="dashboard-header">
                <h1>Tenant Dashboard</h1>
                <p>Welcome back, {currentUser?.email}</p>
            </div>

            <div className="dashboard-content dashboard-grid">
                <div className="dashboard-section glass-panel">
                    <h2>Saved Properties ❤️</h2>
                    <div className="no-data pt-md">
                        <p>You haven't saved any properties yet.</p>
                        <Link to="/search" className="btn btn-outline mt-md">Browse Properties</Link>
                    </div>
                </div>

                <div className="dashboard-section glass-panel">
                    <h2>My Viewing Requests</h2>
                    {loading ? (
                        <div className="loading-state">Loading requests...</div>
                    ) : viewingRequests.length > 0 ? (
                        <ul className="request-list">
                            {viewingRequests.map(req => (
                                <li key={req.id} className="request-item">
                                    <div className="request-info">
                                        <h4>{req.propertyTitle || 'Property Viewing'}</h4>
                                        <p className="request-date">
                                            {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`status-badge status-${req.status || 'pending'}`}>
                                        {req.status || 'Pending'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-data pt-md">
                            <p>You haven't requested any viewings tracking this UID yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
