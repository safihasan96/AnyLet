import { Card } from '../components/ui';

const SECTIONS = [
    {
        number: '1',
        heading: 'Acceptance of Terms',
        body: 'By accessing and using Any-Let, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement.',
    },
    {
        number: '2',
        heading: 'Account Registration',
        body: 'You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate.',
    },
    {
        number: '3',
        heading: 'User Generated Content',
        body: 'You grant us a license to use the materials you post to the property listings. We may use this content for promotional purposes across our network. You must own the rights to the content you post (e.g. photos of properties). Fraudulent listings will result in immediate account termination.',
    },
];

export default function Terms() {
    return (
        <div className="min-h-screen bg-surface-sunken py-12">
            <div className="max-w-3xl mx-auto px-6">

                <header className="mb-10">
                    <h1 className="text-display-sm font-bold text-content mb-3">Terms &amp; Conditions</h1>
                    <p className="text-body-sm font-medium text-muted">
                        Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </header>

                <div className="space-y-5">
                    {SECTIONS.map(({ number, heading, body }) => (
                        <Card key={number} padding="lg">
                            <div className="flex items-start gap-5">
                                <div className="shrink-0 size-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-body-sm font-bold text-primary">{number}</span>
                                </div>
                                <div>
                                    <h2 className="text-title-sm font-bold text-content mb-3">{heading}</h2>
                                    <p className="text-body-md text-muted leading-relaxed">{body}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
}
