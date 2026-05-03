import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Mail, Lock, ArrowRight, Home as HomeIcon } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const userCredential = await login(email, password);
            const snap = await getDoc(doc(db, 'users', userCredential.user.uid));
            const role = snap.exists() ? snap.data().role : 'user';
            navigate(role === 'admin' ? '/admin' : '/');
        } catch (err) {
            setError('Check your email and password');
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 p-6">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <div className="flex items-center gap-2 mb-12">
                    <div className="size-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <HomeIcon size={24} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">Rent.BD</h2>
                </div>

                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Welcome <br /> Back!</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Sign in to manage your rentals.</p>
                </div>

                {error && <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-wider mb-6 border border-rose-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Link to="/forgot-password" className="text-[10px] uppercase font-black text-primary tracking-widest cursor-pointer hover:underline">Forgot Password?</Link>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-4"
                    >
                        {loading ? "AUTHENTICATING..." : "SIGN IN NOW"}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Don't have an account? <Link to="/signup" className="text-primary font-black ml-1">Create One</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
