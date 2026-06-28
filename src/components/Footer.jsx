import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Facebook, Twitter, Instagram, Linkedin, ShieldCheck, Mail, ArrowRight, MapPin, Phone } from 'lucide-react';

/* ─── Variants (all transform-only — zero layout cost) ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
};

const colVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 }
  }
};

const linkVariants = {
  rest: { x: 0, color: undefined },
  hover: { x: 5, transition: { type: 'spring', stiffness: 500, damping: 28 } }
};

const socialVariants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.14, y: -3, transition: { type: 'spring', stiffness: 480, damping: 20 } },
  tap: { scale: 0.88, transition: { type: 'spring', stiffness: 580, damping: 22 } }
};

const logoVariants = {
  rest: { rotate: 0 },
  hover: { rotate: 12, scale: 1.08, transition: { type: 'spring', stiffness: 460, damping: 18 } }
};

/* ─── Animated Link Row ─── */
function FooterLink({ to, children }) {
  return (
    <li>
      <motion.div variants={linkVariants} initial="rest" whileHover="hover" className="inline-flex items-center">
        <Link
          to={to}
          className="text-slate-500 dark:text-slate-400 font-semibold text-sm hover:text-primary dark:hover:text-indigo-400 transition-colors"
        >
          {children}
        </Link>
      </motion.div>
    </li>
  );
}

const SOCIALS = [
  { Icon: Facebook, href: '#', label: 'Facebook' },
  { Icon: Twitter, href: '#', label: 'Twitter' },
  { Icon: Instagram, href: '#', label: 'Instagram' },
  { Icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#0F1117] border-t border-slate-200/50 dark:border-slate-800/50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:max-w-[1400px] lg:px-12">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16"
        >

          {/* ── Brand & Newsletter ── */}
          <motion.div variants={colVariants} className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group mb-6 w-fit">
              <motion.div
                variants={logoVariants}
                initial="rest"
                whileHover="hover"
                className="bg-primary p-2.5 rounded-2xl text-white shadow-lg shadow-primary/25"
              >
                <Building2 size={22} />
              </motion.div>
              <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                any<span className="text-primary italic">.let</span>
              </span>
            </Link>

            <p className="text-slate-500 dark:text-slate-400 font-medium mb-5 max-w-sm leading-relaxed">
              The smartest way to rent, buy, and manage properties in Bangladesh. Finding your next home has never been easier.
            </p>

            {/* Contact snippets */}
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <MapPin size={14} className="text-primary dark:text-indigo-400 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Phone size={14} className="text-primary dark:text-indigo-400 shrink-0" />
                <span>+880 1700-000000</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                Subscribe to Newsletter
              </h4>
              <div className="flex bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-primary transition-colors max-w-sm">
                <div className="flex items-center justify-center pl-3 pr-2 text-slate-400">
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="Enter your email"
                  aria-label="Newsletter email"
                  className="bg-transparent border-none outline-none flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 w-full min-w-0"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="bg-primary text-white p-2.5 rounded-xl shrink-0 hover:bg-primary-dark transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={17} />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── For Tenants ── */}
          <motion.div variants={colVariants}>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">For Tenants</h4>
            <ul className="space-y-4">
              <FooterLink to="/search">Search Properties</FooterLink>
              <FooterLink to="/favorites">Saved Listings</FooterLink>
              <FooterLink to="/requests">My Enquiries</FooterLink>
              <FooterLink to="/blog/tenant-tips">Renting Guide</FooterLink>
            </ul>
          </motion.div>

          {/* ── For Owners ── */}
          <motion.div variants={colVariants}>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">For Owners</h4>
            <ul className="space-y-4">
              <FooterLink to="/post-ad">Post a Listing</FooterLink>
              <FooterLink to="/pricing">Pricing Plans</FooterLink>
              <FooterLink to="/my-listings">Manage Ads</FooterLink>
              <FooterLink to="/blog/owner-tips">Landlord Advice</FooterLink>
            </ul>
          </motion.div>

          {/* ── Company & Legal ── */}
          <motion.div variants={colVariants}>
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-6">Company & Legal</h4>
            <ul className="space-y-4">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/contact">Contact Support</FooterLink>
              <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink to="/terms">Terms & Conditions</FooterLink>
              <FooterLink to="/sitemap">Sitemap</FooterLink>
            </ul>
          </motion.div>
        </motion.div>

        {/* ── Bottom Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between py-6 border-t border-slate-100 dark:border-slate-800 gap-6"
        >
          {/* Trust Badges */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 440, damping: 22 }}
            >
              <Link
                to="/download"
                className="h-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center px-4 hover:bg-[#1a227f] transition-colors"
              >
                <span className="text-white text-xs font-black tracking-wide">Get the App</span>
              </Link>
            </motion.div>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20">
              <ShieldCheck size={15} strokeWidth={2.5} /> SSO Secure
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2.5">
            {SOCIALS.map(({ Icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                variants={socialVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="size-10 rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 dark:hover:text-indigo-400 dark:hover:border-indigo-400/30 transition-colors"
              >
                <Icon size={17} />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-center mt-4"
        >
          <p className="text-xs font-semibold text-slate-400">
            &copy; {new Date().getFullYear()} Any-Let Bangladesh. All rights reserved.
          </p>
        </motion.div>

      </div>
    </footer>
  );
}
