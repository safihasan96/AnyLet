import { motion } from 'framer-motion';
import {
  User, Building2, ShieldCheck, Lock, CreditCard, Settings2, Heart, Star,
  Briefcase, CheckCircle2, Gift, Users, MessageCircle, ClipboardList, FileText,
  Info, Shield, LogOut, Sparkles,
} from 'lucide-react';
import AccordionSection from './AccordionSection';
import MenuItem from './MenuItem';
import { sectionVariants, textVariants } from './motion';

/**
 * AccountMenu — the accordion navigation (account/settings, listings/bookings,
 * referrals, help, legal), the Sign Out button, and the version footer.
 * Presentational; navigation + KYC + logout come from the shell.
 */
export default function AccountMenu({ onNav, onKyc, onLogout, isKycApproved, kycPending }) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-4 space-y-3">
      {/* ── Account & Settings ── */}
      <AccordionSection icon={User} title="Account & Settings" defaultOpen>
        <MenuItem icon={User} label="Edit Profile" sub="Name, phone, photo & location"
          onClick={() => onNav('/edit-profile')} />
        <MenuItem icon={Building2} label="Setup Owner Profile" sub="Manage your public owner page"
          onClick={() => onNav('/setup-owner-profile')} />
        <MenuItem icon={ShieldCheck} label="Identity Verification"
          sub={isKycApproved ? 'KYC Approved ✅' : kycPending ? 'Under Review ⏳' : 'Verify your identity'}
          onClick={onKyc} />
        <MenuItem icon={Lock} label="Change Password" sub="Update your login credentials"
          onClick={() => onNav('/change-password')} />
        <MenuItem icon={CreditCard} label="My Payments" sub="Transaction history & invoices"
          onClick={() => onNav('/my-payments')} />
        <MenuItem icon={Settings2} label="App Preferences" sub="Language, theme & notifications"
          onClick={() => onNav('/settings')} />
      </AccordionSection>

      {/* ── Listings & Bookings ── */}
      <AccordionSection icon={Building2} title="Listings & Bookings">
        <MenuItem icon={Building2} label="My Listings" sub="Manage your posted properties"
          onClick={() => onNav('/my-listings')} />
        <MenuItem icon={Heart} label="Saved Properties" sub="Your wishlist & favourites"
          onClick={() => onNav('/favorites')} />
        <MenuItem icon={Star} label="My Reviews" sub="Reviews you've written"
          onClick={() => onNav('/my-reviews')} />
        <MenuItem icon={Briefcase} label="My Bookings (Tenant)" sub="Properties you have booked"
          onClick={() => onNav('/my-bookings')} />
        <MenuItem icon={CheckCircle2} label="Guest Bookings (Owner)" sub="Confirm move-ins & escrows"
          onClick={() => onNav('/owner-bookings')} />
      </AccordionSection>

      {/* ── Referrals ── */}
      <AccordionSection icon={Gift} title="Referrals">
        <MenuItem icon={Gift} label="Refer an Owner" sub="Invite owners & earn rewards"
          onClick={() => onNav('/referral')} />
        <MenuItem icon={Users} label="My Referrals" sub="Track friends you have invited"
          onClick={() => onNav('/referral')} />
      </AccordionSection>

      {/* ── Help & Support ── */}
      <AccordionSection icon={MessageCircle} title="Help & Support">
        <MenuItem icon={MessageCircle} label="Contact Support" sub="Chat with our support team"
          onClick={() => onNav('/contact')} />
        <MenuItem icon={ClipboardList} label="Inquiry History" sub="View all your enquiries"
          onClick={() => onNav('/enquiry')} />
      </AccordionSection>

      {/* ── Legal & Information ── */}
      <AccordionSection icon={FileText} title="Legal & Information">
        <MenuItem icon={Info} label="About Us" sub="Learn more about Any.Let"
          onClick={() => onNav('/about')} />
        <MenuItem icon={Shield} label="Privacy Policy" sub="How we protect your data"
          onClick={() => onNav('/privacy-policy')} />
        <MenuItem icon={FileText} label="Terms & Conditions" sub="Our terms of service"
          onClick={() => onNav('/terms')} />
      </AccordionSection>

      {/* ── Sign Out ── */}
      <motion.div variants={sectionVariants}>
        <motion.button
          whileHover={{ scale: 1.012, y: -1 }}
          whileTap={{ scale: 0.975 }}
          onClick={onLogout}
          className="transform-gpu w-full flex items-center gap-3.5 px-5 py-4
            bg-white dark:bg-[#1A1D24] rounded-2xl border border-rose-100/80 dark:border-rose-500/20
            hover:bg-rose-50/70 dark:hover:bg-rose-500/[0.06] transition-colors shadow-sm"
        >
          <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
            <LogOut size={17} strokeWidth={2.1} className="text-rose-500" />
          </div>
          <span className="text-[14.5px] font-bold text-rose-500">Sign Out</span>
        </motion.button>
      </motion.div>

      {/* App Version */}
      <motion.div variants={textVariants} className="flex items-center justify-center gap-2 pt-1 pb-2">
        <Sparkles size={11} className="text-slate-300 dark:text-slate-600" />
        <p className="text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">Any.Let · Version 1.0.1</p>
        <Sparkles size={11} className="text-slate-300 dark:text-slate-600" />
      </motion.div>
    </div>
  );
}
