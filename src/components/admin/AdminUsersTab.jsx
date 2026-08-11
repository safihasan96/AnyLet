import { Search, ShieldCheck, UserCheck, UserMinus, Trash2 } from 'lucide-react';

/**
 * AdminUsersTab — platform user directory with search and per-row admin/status/
 * delete actions. Presentational; `users` is the already-filtered list and all
 * handlers come from the AdminPanel shell.
 */
export default function AdminUsersTab({
    users,
    searchQuery,
    onSearchChange,
    onSelectUser,
    onToggleAdmin,
    onToggleStatus,
    onDeleteUser,
}) {
    return (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-8 py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-50">
                <div>
                    <h3 className="text-2xl font-black text-zinc-950">Platform Directory</h3>
                    <p className="text-sm text-zinc-400 font-bold mt-1">{users.length} authenticated identities</p>
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text" placeholder="Search name or email..."
                        value={searchQuery} onChange={e => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-5 py-3 bg-zinc-50 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-300"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-50">
                            <th className="px-8 py-5">Identity</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {users.map(user => (
                            <tr key={user.id} onClick={() => onSelectUser(user)} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center font-black text-zinc-300 text-lg uppercase group-hover:border-emerald-500 group-hover:text-emerald-500 border border-transparent transition-all">
                                            {user.email?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-950 tracking-tight group-hover:text-emerald-600 transition-colors">{user.fullName || 'Anonymous'}</p>
                                            <p className="text-xs font-bold text-zinc-400 mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${user.accountStatus === 'deactivated' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {user.accountStatus === 'deactivated' ? 'Inactive' : 'Active'}
                                        </span>
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{user.role || 'client'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center gap-3">
                                        <button onClick={(e) => { e.stopPropagation(); onToggleAdmin(user); }}
                                            className={`p-3 rounded-xl transition-all border ${user.role === 'admin' ? 'bg-zinc-950 text-white border-zinc-950 hover:bg-emerald-500 hover:border-emerald-500' : 'bg-white text-zinc-400 border-zinc-100 hover:text-emerald-500 hover:border-emerald-200'}`}
                                            title="Toggle Admin">
                                            <ShieldCheck size={18} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onToggleStatus(user); }}
                                            className={`p-3 rounded-xl transition-all border ${user.accountStatus === 'deactivated' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' : 'bg-white text-zinc-400 border-zinc-100 hover:text-red-500 hover:border-red-100'}`}
                                            title="Toggle Status">
                                            {user.accountStatus === 'deactivated' ? <UserCheck size={18} /> : <UserMinus size={18} />}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteUser(user); }}
                                            className="p-3 bg-white text-zinc-200 hover:text-red-500 hover:border-red-100 rounded-xl border border-zinc-100 transition-all"
                                            title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
