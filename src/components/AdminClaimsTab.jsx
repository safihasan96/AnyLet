import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheck, ShieldAlert, User, Check, X } from 'lucide-react';
import logger from '../utils/logger';
import { getApiUrl } from '../utils/api';

export default function AdminClaimsTab() {
    const { currentUser, isAdmin } = useAuth();
    const toast = useToast();
    const [targetUid, setTargetUid] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSetAdminClaim(grantAdmin) {
        if (!targetUid.trim()) {
            toast.error('Please enter a User ID');
            return;
        }

        setLoading(true);
        try {
            const idToken = await currentUser.getIdToken();
            const response = await fetch(getApiUrl('/api/admin?action=set-claim'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ targetUid: targetUid.trim(), grantAdmin }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Request failed');

            toast.success(data.message || `Admin claim ${grantAdmin ? 'granted' : 'revoked'} successfully`);
            setTargetUid('');
        } catch (err) {
            logger.error('Failed to update admin claim:', err);
            toast.error(err.message || 'Failed to update admin claim');
        } finally {
            setLoading(false);
        }
    }

    if (!isAdmin) {
        return (
            <div className="p-8 text-center text-zinc-500">
                You do not have permission to view this page.
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500" size={28} />
                    Admin Access Management
                </h2>
                <p className="text-zinc-400 mt-2">
                    Securely grant or revoke administrator privileges for other users using Firebase Custom Claims.
                </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/60 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-zinc-300 mb-2">
                    Target User ID (UID)
                </label>
                <input
                    type="text"
                    value={targetUid}
                    onChange={(e) => setTargetUid(e.target.value)}
                    placeholder="Enter Firebase User ID..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors mb-6"
                />

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleSetAdminClaim(true)}
                        disabled={loading || !targetUid.trim()}
                        className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <Check size={18} />
                                Grant Admin Access
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => handleSetAdminClaim(false)}
                        disabled={loading || !targetUid.trim()}
                        className="flex-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                <X size={18} />
                                Revoke Admin Access
                            </>
                        )}
                    </button>
                </div>
                
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                    <ShieldAlert className="text-amber-500 flex-shrink-0" size={20} />
                    <p className="text-amber-500/90 text-sm font-medium">
                        Warning: Granting admin access gives the user full control over the platform. Ensure you have verified the user's identity before proceeding.
                    </p>
                </div>
            </div>
        </div>
    );
}
