import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
            <div className="max-w-3xl mx-auto px-6 prose dark:prose-invert prose-slate">
                {/* Back button handled by MobileNavBar */}
                <h1 className="text-4xl font-black mb-8 text-slate-900 dark:text-white">Privacy Policy</h1>
                <p className="font-bold text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
                
                <section className="mb-8 p-8 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.
                    </p>

                    <h2 className="text-2xl font-bold mb-4 mt-8">2. How We Use Information</h2>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
                        <li>Provide, maintain, and improve our Services.</li>
                        <li>Perform internal operations, including troubleshooting software bugs.</li>
                        <li>Send or facilitate communications between users (e.g. owners and tenants).</li>
                        <li>Personalize and improve the Services, including provide or recommend features, content, social connections, referrals, and advertisements.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mb-4 mt-8">3. Sharing of Information</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        We may share the information we collect about you with third parties or allow them to collect information from our Services in certain circumstances. Examples include sharing with property landlords when you request a viewing, or with law enforcement in response to legal processes.
                    </p>
                </section>
            </div>
        </div>
    );
}
