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
                { name: "My Listings", path: "/my-listings" },
                { name: "Saved Properties", path: "/favorites" }
            ]
        },
        {
            title: "For Owners",
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
        <div className="min-h-screen bg-surface-sunken py-16">
            <div className="max-w-4xl mx-auto px-6">
                <header className="mb-12 border-b border-border pb-8">
                    <h1 className="text-4xl font-bold text-content mb-4">Site Map</h1>
                    <p className="text-lg text-muted font-medium">Find your way around Any-Let.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-10">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-surface p-8 rounded-card shadow-sm border border-border">
                            <h2 className="text-xl font-bold text-content mb-6 uppercase tracking-widest text-sm">{section.title}</h2>
                            <ul className="space-y-4">
                                {section.links.map((link, ldx) => (
                                    <li key={ldx}>
                                        <Link to={link.path} className="font-bold text-muted hover:text-primary transition-colors">
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
