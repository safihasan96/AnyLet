import { Card } from '../components/ui';

const SECTIONS = [
    {
        number: '1',
        heading: 'Information We Collect',
        body: 'We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested, delivery notes, and other information you choose to provide.',
        list: null,
    },
    {
        number: '2',
        heading: 'How We Use Information',
        body: null,
        list: [
            'Provide, maintain, and improve our Services.',
            'Perform internal operations, including troubleshooting software bugs.',
            'Send or facilitate communications between users (e.g. owners and tenants).',
            'Personalize and improve the Services, including provide or recommend features, content, referrals, and advertisements.',
        ],
    },
    {
        number: '3',
        heading: 'Sharing of Information',
        body: 'We may share the information we collect about you with third parties or allow them to collect information from our Services in certain circumstances. Examples include sharing with property landlords when you request a viewing, or with law enforcement in response to legal processes.',
        list: null,
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-surface-sunken py-12">
            <div className="max-w-3xl mx-auto px-6">

                <header className="mb-10">
                    <h1 className="text-display-sm font-bold text-content mb-3">Privacy Policy</h1>
                    <p className="text-body-sm font-medium text-muted">
                        Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </header>

                <div className="space-y-5">
                    {SECTIONS.map(({ number, heading, body, list }) => (
                        <Card key={number} padding="lg">
                            <div className="flex items-start gap-5">
                                <div className="shrink-0 size-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-body-sm font-bold text-primary">{number}</span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-title-sm font-bold text-content mb-3">{heading}</h2>
                                    {body && (
                                        <p className="text-body-md text-muted leading-relaxed">{body}</p>
                                    )}
                                    {list && (
                                        <ul className="space-y-2">
                                            {list.map((item) => (
                                                <li key={item} className="flex items-start gap-2.5 text-body-sm text-muted leading-relaxed">
                                                    <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
}
