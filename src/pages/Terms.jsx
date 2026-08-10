import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
            <Helmet>
                <title>Terms & Conditions | Any-Let</title>
                <meta name="description" content="Terms and Conditions for using Any-Let." />
            </Helmet>
            <div className="max-w-3xl mx-auto px-6 prose dark:prose-invert prose-slate">
                {/* Back button handled by MobileNavBar */}
                <h1 className="text-4xl font-black mb-8 text-slate-900 dark:text-white">Terms & Conditions</h1>
                <p className="font-bold text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
                
                <section className="mb-8 p-8 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                    <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        By accessing and using Any-Let, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement.
                    </p>

                    <h2 className="text-2xl font-bold mb-4 mt-8">2. Account Registration</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate.
                    </p>

                    <h2 className="text-2xl font-bold mb-4 mt-8">3. User Generated Content</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        You grant us a license to use the materials you post to the property listings. We may use this content for promotional purposes across our network. You must own the rights to the content you post (e.g. photos of properties). Fraudulent listings will result in immediate account termination.
                    </p>
                </section>
            </div>
        </div>
    );
}
