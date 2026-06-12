import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
  IconViveroRich,
  IconMensajesRich,
  IconBotRich,
  IconAddRich,
  IconPlantsRich,
  IconDiaryRich,
  IconGeneticaRich,
  IconClimateRich,
  IconAlertsRich,
  IconLogoutRich
} from './CustomIcons';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number | string;
}

// Convert snake_case or kebab-case to CamelCase
const toCamelCase = (str: string): string => {
  return str
    .replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase())
    .replace(/^(.)/, (_, letter) => letter.toUpperCase());
};

// Map Material Symbols names to Lucide icons
const lucideMapping: Record<string, string> = {
  arrow_back: 'ArrowLeft',
  arrow_forward: 'ArrowRight',
  arrow_upward: 'ArrowUp',
  arrow_downward: 'ArrowDown',
  close: 'X',
  delete: 'Trash2',
  warning: 'AlertTriangle',
  notifications: 'Bell',
  notifications_off: 'BellOff',
  notifications_active: 'BellRing',
  add_a_photo: 'Camera',
  add_photo_alternate: 'Image',
  attach_money: 'DollarSign',
  schedule: 'Clock',
  edit_calendar: 'CalendarRange',
  person: 'User',
  settings: 'Settings',
  logout: 'LogOut',
  search: 'Search',
  psychology_alt: 'Brain',
  psychology: 'Brain',
  autorenew: 'RefreshCw',
  analytics: 'BarChart2',
  payments: 'CreditCard',
  info: 'Info',
  play_arrow: 'Play',
  lock: 'Lock',
  fingerprint: 'Fingerprint',
  public: 'Globe',
  folder_open: 'FolderOpen',
  verified: 'CheckCircle2',
  check: 'Check',
  movie: 'Film',
  dashboard: 'LayoutDashboard',
  thermostat: 'Thermometer',
  check_circle: 'CheckCircle2',
  menu: 'Menu',
  water_drop: 'Droplets',
  calendar_today: 'Calendar',
  location_on: 'MapPin',
};

export const Icon: React.FC<IconProps> = ({ name, className = "", size }) => {
  const normalizedName = name.toLowerCase().replace(/^icon-/, '');

  // 1. Match Custom Rich SVGs
  const parsedSize = typeof size === 'number' ? size : undefined;
  
  if (normalizedName === 'vivero' || normalizedName === 'greenhouse' || normalizedName === 'my-nursery') {
    return <IconViveroRich size={parsedSize} />;
  }
  if (normalizedName === 'mensajes' || normalizedName === 'chat' || normalizedName === 'forum') {
    return <IconMensajesRich size={parsedSize} />;
  }
  if (normalizedName === 'bot' || normalizedName === 'smart_toy' || normalizedName === 'adb') {
    return <IconBotRich size={parsedSize} />;
  }
  if (normalizedName === 'add' || normalizedName === 'add_box') {
    return <IconAddRich size={parsedSize} />;
  }
  if (normalizedName === 'plants' || normalizedName === 'local_florist' || normalizedName === 'grass') {
    return <IconPlantsRich size={parsedSize} />;
  }
  if (normalizedName === 'diary' || normalizedName === 'book' || normalizedName === 'menu_book') {
    return <IconDiaryRich size={parsedSize} />;
  }
  if (normalizedName === 'genetica' || normalizedName === 'crosses' || normalizedName === 'science' || normalizedName === 'biotech') {
    return <IconGeneticaRich size={parsedSize} />;
  }
  if (normalizedName === 'climate' || normalizedName === 'thermostat' || normalizedName === 'wb_sunny') {
    return <IconClimateRich size={parsedSize} />;
  }
  if (normalizedName === 'alerts' || normalizedName === 'notifications' || normalizedName === 'notifications_active') {
    return <IconAlertsRich size={parsedSize} />;
  }
  if (normalizedName === 'logout' || normalizedName === 'exit_to_app') {
    return <IconLogoutRich size={parsedSize} />;
  }

  // 2. Resolve to Lucide Icon
  const mappedName = lucideMapping[name] || toCamelCase(name);
  const LucideComponent = (LucideIcons as any)[mappedName] || LucideIcons.HelpCircle;

  // Use 1em size by default if none provided, which inherits the parent's font-size (like material symbols font did)
  const finalSize = size || '1.2em';

  return (
    <LucideComponent 
      size={finalSize} 
      className={className} 
      strokeWidth={2}
    />
  );
};