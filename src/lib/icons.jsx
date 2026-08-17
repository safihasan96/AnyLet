/* eslint-disable react-refresh/only-export-components --
   Registry file: intentionally co-locates the <Icon/> component with its icon
   map + size tokens. Fast-refresh isn't relevant for a stateless registry. */
/**
 * Icon system — the single source of truth for iconography.
 *
 * WHY: prevents "random icons" — the same concept (close, save, verified, a
 * bedroom…) must always render the SAME lucide glyph at a consistent stroke and
 * size across the whole product. Feature code imports concepts from here, never
 * arbitrary icons from `lucide-react` (a lint rule enforces this in the design-
 * system layer — see eslint.config.js `no-restricted-imports`).
 *
 * USAGE:
 *   import { Icon } from '../../lib/icons';
 *   <Icon name="close" />                 // concept key
 *   <Icon name="save" size="lg" />        // explicit size token
 *   <Icon as={SomeLucide} />              // escape hatch (rare)
 *
 * Inside primitives that already size their icon slot via `[&>svg]:size-*`,
 * omit `size` and the parent controls dimensions; the registry still guarantees
 * the glyph + stroke are consistent.
 */
import {
  // navigation
  X, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Menu, MoreVertical, MoreHorizontal, ExternalLink, Compass, Map,
  // actions
  Search, Plus, Minus, Check, CheckCheck, Pencil, Trash2, Copy, Share2, SlidersHorizontal,
  Filter, Download, Upload, RefreshCw, Send, Reply, LogIn, LogOut, Eye, EyeOff, Bookmark,
  // status
  CheckCircle2, AlertCircle, AlertTriangle, Info, ShieldCheck, BadgeCheck, Clock,
  Lock, Star, Sparkles, TrendingUp,
  // account / app
  User, Users, Settings, Bell, MessageSquare, Heart, CreditCard, LayoutDashboard,
  FileText, HelpCircle, Gift, Globe, Sun, Moon, Tag, Calendar, Mail, Phone,
  // property domain
  Home, Building2, BedDouble, Bath, Maximize2, Ruler, MapPin, DoorOpen, Warehouse,
  Store, Trees, Hotel, Waves, Briefcase, Car, Wifi, Zap, Sofa,
  // media
  Image as ImageIcon, ImageOff, Camera, Expand, Play,
  // social
  Facebook, Instagram, Linkedin, Twitter,
} from 'lucide-react';
import { cn } from './cn';

/** Concept → lucide component. One glyph per meaning. Add here, don't inline. */
export const Icons = {
  // ── navigation ──────────────────────────────────────────────
  close: X,
  back: ArrowLeft,
  forward: ArrowRight,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  menu: Menu,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  externalLink: ExternalLink,
  explore: Compass,
  map: Map,

  // ── actions ─────────────────────────────────────────────────
  search: Search,
  add: Plus,
  minus: Minus,
  check: Check,
  checkCheck: CheckCheck,
  reply: Reply,
  edit: Pencil,
  delete: Trash2,
  copy: Copy,
  share: Share2,
  filter: SlidersHorizontal,
  filterAlt: Filter,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  retry: RefreshCw,
  send: Send,
  login: LogIn,
  logout: LogOut,
  show: Eye,
  hide: EyeOff,
  save: Bookmark,

  // ── status ──────────────────────────────────────────────────
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  verified: ShieldCheck,
  badge: BadgeCheck,
  pending: Clock,
  time: Clock,
  locked: Lock,
  rating: Star,
  sparkle: Sparkles,
  trending: TrendingUp,

  // ── account / app ───────────────────────────────────────────
  user: User,
  users: Users,
  settings: Settings,
  notifications: Bell,
  messages: MessageSquare,
  favorite: Heart,
  payments: CreditCard,
  dashboard: LayoutDashboard,
  document: FileText,
  help: HelpCircle,
  referral: Gift,
  language: Globe,
  themeLight: Sun,
  themeDark: Moon,
  tag: Tag,
  calendar: Calendar,
  email: Mail,
  phone: Phone,

  // ── property domain ─────────────────────────────────────────
  location: MapPin,
  bed: BedDouble,
  bath: Bath,
  area: Maximize2,
  ruler: Ruler,
  home: Home,
  apartment: Building2,
  room: DoorOpen,
  warehouse: Warehouse,
  shop: Store,
  land: Trees,
  hotel: Hotel,
  resort: Waves,
  commercial: Briefcase,
  parking: Car,
  wifi: Wifi,
  utilities: Zap,
  furnished: Sofa,

  // ── media ───────────────────────────────────────────────────
  image: ImageIcon,
  imageOff: ImageOff,
  camera: Camera,
  expand: Expand,
  play: Play,

  // ── social ──────────────────────────────────────────────────
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
};

// Size tokens map to the design scale (px via Tailwind size-*).
export const iconSizes = {
  xs: 'size-3.5', // 14
  sm: 'size-4',   // 16
  md: 'size-5',   // 20
  lg: 'size-6',   // 24
  xl: 'size-7',   // 28
};

// House stroke width — slightly lighter than lucide's default 2 for a calmer,
// more premium line. Applied to every icon rendered through <Icon/>.
export const ICON_STROKE = 1.75;

/**
 * Icon — the wrapper every icon renders through. Guarantees consistent stroke
 * and (optionally) size, and sane a11y: decorative by default (aria-hidden),
 * or a labelled image when `label` is passed.
 */
export function Icon({ name, as, size, strokeWidth = ICON_STROKE, label, className, ...props }) {
  const Cmp = as || Icons[name];
  if (!Cmp) {
    if (import.meta.env?.DEV) console.warn(`[Icon] Unknown icon "${name}". Add it to src/lib/icons.jsx.`);
    return null;
  }
  return (
    <Cmp
      strokeWidth={strokeWidth}
      className={cn(size && iconSizes[size], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    />
  );
}

export default Icon;
