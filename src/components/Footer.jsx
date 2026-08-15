import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from './layout/Container';
import { Input, IconButton, Badge, Icon } from './ui';

/**
 * Footer — global footer rebuilt on tokens + primitives. One subtle in-view fade
 * (motion restraint), semantic colors that adapt to theme with no `dark:`
 * classes, restrained weights, and the icon registry for socials/contact.
 */
const COLUMNS = [
  {
    title: 'For Tenants',
    links: [
      { to: '/search', label: 'Search Properties' },
      { to: '/favorites', label: 'Saved Listings' },
      { to: '/enquiry', label: 'My Enquiries' },
      { to: '/blog', label: 'Renting Guide' },
    ],
  },
  {
    title: 'For Owners',
    links: [
      { to: '/post-ad', label: 'Post a Listing' },
      { to: '/pricing', label: 'Pricing Plans' },
      { to: '/my-listings', label: 'Manage Ads' },
      { to: '/blog', label: 'Landlord Advice' },
    ],
  },
  {
    title: 'Company & Legal',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/contact', label: 'Contact Support' },
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms & Conditions' },
      { to: '/sitemap', label: 'Sitemap' },
    ],
  },
];

const SOCIALS = [
  { icon: 'facebook', href: '#', label: 'Facebook' },
  { icon: 'twitter', href: '#', label: 'Twitter' },
  { icon: 'instagram', href: '#', label: 'Instagram' },
  { icon: 'linkedin', href: '#', label: 'LinkedIn' },
];

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="text-body-sm text-muted transition-colors hover:text-primary">
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container size="wide" className="pb-8 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5"
        >
          {/* Brand + newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-5 flex w-fit items-center gap-2.5 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <span className="grid size-9 place-items-center rounded-control bg-primary text-on-primary shadow-card">
                <Icon name="apartment" className="size-5" />
              </span>
              <span className="font-display text-title-md tracking-tight text-content">
                any<span className="text-primary italic">.let</span>
              </span>
            </Link>

            <p className="mb-5 max-w-sm text-body-sm leading-relaxed text-muted">
              The smartest way to rent, buy, and manage properties in Bangladesh. Finding your next home has never been easier.
            </p>

            <div className="mb-6 space-y-2">
              <p className="flex items-center gap-2 text-body-sm text-muted">
                <Icon name="location" className="size-4 shrink-0 text-subtle" /> Dhaka, Bangladesh
              </p>
              <p className="flex items-center gap-2 text-body-sm text-muted">
                <Icon name="phone" className="size-4 shrink-0 text-subtle" /> +880 1700-000000
              </p>
            </div>

            <div className="max-w-sm">
              <p className="mb-2 text-overline uppercase text-subtle">Subscribe to our newsletter</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input type="email" inputMode="email" placeholder="Enter your email" aria-label="Newsletter email" leftIcon={<Icon name="email" />} className="flex-1" />
                <IconButton type="submit" label="Subscribe" variant="primary">
                  <Icon name="forward" />
                </IconButton>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="mb-4 text-overline uppercase text-subtle">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <FooterLink key={l.label} to={l.to}>{l.label}</FooterLink>
                ))}
              </ul>
            </nav>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-6 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/download"
              className="inline-flex h-10 items-center rounded-control bg-content px-4 text-body-sm font-medium text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Get the App
            </Link>
            <Badge tone="success" size="md" icon={<Icon name="verified" />}>SSL Secure</Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {SOCIALS.map((s) => (
              <IconButton key={s.label} as="a" href={s.href} label={s.label} variant="ghost">
                <Icon name={s.icon} />
              </IconButton>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-caption text-subtle">
          &copy; {new Date().getFullYear()} Any-Let Bangladesh. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
