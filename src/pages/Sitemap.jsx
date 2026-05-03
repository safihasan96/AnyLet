import { Link } from 'react-router-dom';

export default function Sitemap() {
    const sections = [
        {
            title: "Main Pages",
            links: [
                { name: "Home", path: "/" },
                { name: "Search / Discover", path: "/search" },
                { name: "Download App", path: "/download" }
            ]
        },
        {
            title: "For Users",
            links: [
                { name: "Login", path: "/login" },
                { name: "Register", path: "/signup" },
                { name: "User Dashboard", path: "/dashboard" },
                { name: "Saved Properties", path: "/favorites" }
            ]
        },
        {
            title: "For Owners & Agents",
            links: [
                { name: "Post an Ad", path: "/post-ad" },
                { name: "Pricing Plans", path: "/pricing" }
            ]
        },
        {
            title: "Company",
            links: [
                { name: "About Us", path: "/about" },
                { name: "Contact Support", path: "/contact" },
                { name: "Privacy Policy", path: "/privacy-policy" },
                { name: "Terms & Conditions", path: "/terms" }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16">
            <div className="max-w-4xl mx-auto px-6">
                <header className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Site Map</h1>
                    <p className="text-lg text-slate-500 font-medium">Find your way around Any-Let.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-10">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-sm">{section.title}</h2>
                            <ul className="space-y-4">
                                {section.links.map((link, ldx) => (
                                    <li key={ldx}>
                                        <Link to={link.path} className="font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
