import { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Card, Field, Input, Textarea, Button, Badge } from '../components/ui';

const CONTACT_CARDS = [
    {
        icon: MapPin,
        color: 'text-primary',
        bg: 'bg-primary/10',
        title: 'Office Address',
        content: 'Gulshan 1, Dhaka 1212\nBangladesh',
    },
    {
        icon: Phone,
        color: 'text-success',
        bg: 'bg-success/10',
        title: 'Phone Number',
        content: '+880 1700-000000',
        badge: '10 AM – 6 PM',
    },
    {
        icon: Mail,
        color: 'text-info',
        bg: 'bg-info/10',
        title: 'Email Address',
        content: 'support@anylet.com.bd',
    },
];

export default function Contact() {
    const toast = useToast();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            toast.success('Message sent! We\'ll get back to you soon.');
            e.target.reset();
        }, 800);
    };

    return (
        <div className="min-h-screen bg-surface-sunken py-12">
            <div className="max-w-6xl mx-auto px-6">

                <header className="text-center mb-16">
                    <h1 className="text-display-sm font-bold text-content mb-4">Contact Support</h1>
                    <p className="text-body-lg text-muted">We&apos;re here to help you 24/7.</p>
                </header>

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* Contact Info */}
                    <div className="space-y-5">
                        {CONTACT_CARDS.map(({ icon: Icon, color, bg, title, content, badge }) => (
                            <Card key={title} padding="lg" className="flex items-start gap-5">
                                <div className={`p-3.5 ${bg} ${color} rounded-card shrink-0`}>
                                    <Icon size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-content mb-1">{title}</h3>
                                    <p className="text-body-sm text-muted whitespace-pre-line leading-relaxed">{content}</p>
                                    {badge && (
                                        <Badge variant="success" size="sm" className="mt-2">{badge}</Badge>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Contact Form */}
                    <Card padding="lg" as="form" onSubmit={handleSubmit}>
                        <h2 className="text-title-lg font-bold text-content mb-6">Send a Message</h2>

                        <div className="space-y-4">
                            <Field label="Your Name" required>
                                <Input name="name" type="text" placeholder="e.g. Rahim Uddin" required />
                            </Field>
                            <Field label="Email Address" required>
                                <Input name="email" type="email" placeholder="you@example.com" required />
                            </Field>
                            <Field label="Message" required>
                                <Textarea
                                    name="message"
                                    rows={5}
                                    placeholder="Describe your issue or question..."
                                    required
                                />
                            </Field>

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                loading={submitting}
                                leftIcon={<Send size={18} />}
                            >
                                Send Message
                            </Button>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
