import {
  BriefcaseBusiness,
  Calendar,
  CalendarCheck,
  ChartColumn,
  Clock,
  CreditCard,
  FileText,
  HardHat,
  Heart,
  House,
  Inbox,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Star,
  TriangleAlert,
  User,
  Users,
  Wallet,
  Wrench,
  Plus,
} from "lucide-react";

/**
 * Nav entries in `lib/strings.ts` carry an icon *name* rather than a component,
 * so the strings file stays free of imports and can be read as pure copy.
 * This maps the names back to glyphs.
 */
const MAP: Record<string, React.ElementType> = {
  "layout-dashboard": LayoutDashboard,
  search: Search,
  "file-text": FileText,
  "receipt-text": ReceiptText,
  "calendar-check": CalendarCheck,
  "message-square": MessageSquare,
  heart: Heart,
  "map-pin": MapPin,
  "credit-card": CreditCard,
  star: Star,
  settings: Settings,
  inbox: Inbox,
  briefcase: BriefcaseBusiness,
  calendar: Calendar,
  wrench: Wrench,
  clock: Clock,
  wallet: Wallet,
  "shield-check": ShieldCheck,
  users: Users,
  "hard-hat": HardHat,
  "triangle-alert": TriangleAlert,
  "chart-column": ChartColumn,
  house: House,
  user: User,
  plus: Plus,
};

export function NavIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && MAP[name]) || LayoutDashboard;
  return <Icon aria-hidden="true" strokeWidth={1.75} className={className} />;
}
