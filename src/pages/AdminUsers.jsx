import { useState, useEffect } from 'react';
import {
    collection, onSnapshot, updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { Search, UserMinus, UserCheck, Trash2, Shield, User } from 'lucide-react';
import { db } from '../firebase';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Confirmation modal state
    const [modal, setModal] = useState({
        isOpen: false, title: '', message: '',
        confirmText: 'Confirm', confirmColor: '#ef4444',
        isSuccess: false, isLoading: false, onConfirm: null,
    });

    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false, isSuccess: false }));
    const showModal = (config) => setModal({ ...config, isOpen: true, isSuccess: false, isLoading: false });

    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(list);
            setLoading(false);
        }, (err) => {
            console.error('Error listening to users:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleToggleUserStatus = (user) => {
        const isActive = user.accountStatus !== 'deactivated';
        showModal({
            title: isActive ? '⛔ Deactivate User' : '✅ Reactivate User',
            message: isActive
                ? `Deactivate ${user.fullName || user.email}? They will be suspended on the platform.`
                : `Reactivate ${user.fullName || user.email}? Their account will be restored.`,
            confirmText: isActive ? 'Deactivate' : 'Reactivate',
            confirmColor: isActive ? '#dc3545' : '#28a745',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    const newStatus = isActive ? 'deactivated' : 'active';
                    await updateDoc(doc(db, 'users', user.id), { accountStatus: newStatus });
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) {
                    console.error(e);
                    setModal(p => ({ ...p, isLoading: false, isOpen: false }));
                }
            }
        });
    };

    const handleDeleteUser = (user) => {
        showModal({
            title: '🗑️ Delete User',
            message: `Permanently delete ${user.fullName || user.email}? This cannot be undone.`,
            confirmText: 'Delete User',
            confirmColor: '#dc3545',
            onConfirm: async () => {
                setModal(p => ({ ...p, isLoading: true }));
                try {
                    await deleteDoc(doc(db, 'users', user.id));
                    setModal(p => ({ ...p, isLoading: false, isSuccess: true }));
                    setTimeout(closeModal, 1500);
                } catch (e) {
                    console.error(e);
                    setModal(p => ({ ...p, isLoading: false, isOpen: false }));
                }
            }
        });
    };

    const handleChangeRole = async (user, newRole) => {
        try {
            await updateDoc(doc(db, 'users', user.id), {
                role: newRole,
                isAdmin: newRole === 'admin',
            });
        } catch (e) {
            console.error('Failed to update role:', e);
        }
    };

    const filteredUsers = searchQuery.trim()
        ? users.filter(u =>
            (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : users;

    return (
        <div className="fade-in">
            <div className="admin-page-title">
                <h1>User Management</h1>
                <p>Manage platform users, roles, and account statuses in real-time.</p>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="admin-search" style={{ margin: 0 }}>
                        <Search size={16} className="admin-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '300px' }}
                        />
                    </div>
                    <div style={{ color: '#adb5bd', fontSize: '0.85rem', fontWeight: 600 }}>
                        Showing {filteredUsers.length} Users
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f4f6' }}>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 700, color: '#495057' }}>User Info</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 700, color: '#495057' }}>Contact</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 700, color: '#495057' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 700, color: '#495057' }}>Role</th>
                                <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 700, color: '#495057' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>
                                        <div className="animate-spin" style={{ margin: '0 auto', width: '30px', height: '30px', border: '3px solid #f1f4f6', borderTopColor: '#3f6ad8', borderRadius: '50%' }} />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#adb5bd' }}>
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => {
                                const isDeactivated = user.accountStatus === 'deactivated';
                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f4f6', transition: 'all 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    background: isDeactivated ? '#dee2e6' : '#3f6ad8',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700
                                                }}>
                                                    {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 700, color: isDeactivated ? '#adb5bd' : '#495057' }}>{user.fullName || 'Anonymous'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#6c757d' }}>
                                            {user.email}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '30px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                background: isDeactivated ? '#fbebed' : '#eaf9f2',
                                                color: isDeactivated ? '#d92550' : '#3ac47d'
                                            }}>
                                                {isDeactivated ? 'DEACTIVATED' : 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <select
                                                value={user.role || 'user'}
                                                onChange={(e) => handleChangeRole(user, e.target.value)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ced4da',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="user">User</option>
                                                <option value="adviser">Adviser</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleToggleUserStatus(user)}
                                                    className="btn-icon"
                                                    title={isDeactivated ? 'Reactivate' : 'Deactivate'}
                                                    style={{
                                                        background: isDeactivated ? '#eaf9f2' : '#fbebed',
                                                        color: isDeactivated ? '#3ac47d' : '#d92550',
                                                        border: 'none',
                                                        padding: '0.5rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {isDeactivated ? <UserCheck size={18} /> : <UserMinus size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="btn-icon"
                                                    title="Delete User"
                                                    style={{
                                                        background: '#fff3f3',
                                                        color: '#f5365c',
                                                        border: 'none',
                                                        padding: '0.5rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                confirmText={modal.confirmText}
                confirmColor={modal.confirmColor}
                isSuccess={modal.isSuccess}
                isLoading={modal.isLoading}
                onConfirm={modal.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
}
