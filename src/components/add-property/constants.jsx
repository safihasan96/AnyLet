import {
    Flame, Zap, Droplets, Wifi, Trash2, Battery, ArrowRight, ShieldCheck,
    DoorOpen, ChevronsUp, Phone, CloudSun, UtensilsCrossed, Thermometer,
    Package, Wind, Building2, Car, Bike,
} from 'lucide-react';

// Static option lists for the AddProperty wizard.

export const BILLING_CYCLES = ["Month", "Week", "Day"];

export const PROPERTY_TYPES = ["House", "Apartment", "Sublet", "Room", "Mess", "Cottage", "Hotel", "Resort", "Commercial Space", "Land", "Shop", "Others"];

export const TENANT_TYPES = ["Any", "Family", "Bachelor (Male)", "Bachelor (Female)"];

export const UTILITY_OPTIONS = [
    { id: 'Prepaid Gas', icon: <Flame size={16} /> },
    { id: 'Line Gas', icon: <Flame size={16} /> },
    { id: 'Prepaid Electricity', icon: <Zap size={16} /> },
    { id: 'Postpaid Electricity', icon: <Zap size={16} /> },
    { id: 'Water (WASA)', icon: <Droplets size={16} /> },
    { id: 'Deep Tube-well Water', icon: <Droplets size={16} /> },
    { id: 'Central WiFi', icon: <Wifi size={16} /> },
    { id: 'Trash Collection', icon: <Trash2 size={16} /> },
    { id: 'Generator/IPS Backup', icon: <Battery size={16} /> }
];

export const FEATURE_OPTIONS = [
    { id: 'Lift/Elevator', icon: <ArrowRight className="rotate-[-90deg]" size={16} /> },
    { id: 'CCTV Security', icon: <ShieldCheck size={16} /> },
    { id: 'Fire Exit', icon: <DoorOpen size={16} /> },
    { id: 'Emergency Stairs', icon: <ChevronsUp size={16} /> },
    { id: 'Intercom', icon: <Phone size={16} /> },
    { id: 'Roof Access', icon: <CloudSun size={16} /> },
    { id: 'Drawing & Dining Separate', icon: <UtensilsCrossed size={16} /> },
    { id: 'Geyser Connection', icon: <Thermometer size={16} /> },
    { id: 'Cabinet/Wall Cupboard', icon: <Package size={16} /> },
    { id: 'Balcony', icon: <Wind size={16} /> },
    { id: 'Tiled Floor', icon: <Building2 size={16} /> },
    { id: 'Car Parking', icon: <Car size={16} /> },
    { id: 'Bike Parking', icon: <Bike size={16} /> }
];
