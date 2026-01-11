
import { WeeklySchedule, Restaurant } from './types';

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = DAYS_OF_WEEK.reduce((acc, day) => ({
  ...acc,
  [day]: { open: '10:00', close: '22:00', closed: false }
}), {});

export const DEFAULT_RESTAURANT: Restaurant = {
  id: 'default-1',
  name: 'Le Bistro Charmant',
  slug: 'le-bistro-charmant',
  description: 'Authentic French cuisine in a cozy neighborhood setting. Famous for our house-made pastries and evening steak frites.',
  cuisineType: 'French',
  whatsappNumber: '1234567890',
  operatingHours: DEFAULT_WEEKLY_SCHEDULE,
  tables: { count: 12, capacity: 4 },
  avgDiningDuration: 60,
  bookingInterval: 30,
  maxDaysAdvance: 30,
  policies: 'We hold tables for 15 minutes. No-shows may be blocked from future bookings.',
  blockedDates: [],
};

export const COLORS = {
  primary: 'bg-[#800020]', // Burgundy
  primaryHover: 'hover:bg-[#600018]',
  accent: 'text-[#D4AF37]', // Gold
  bg: 'bg-[#FFFDD0]', // Cream
};
