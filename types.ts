
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface OperatingHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface WeeklySchedule {
  [key: string]: OperatingHours;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisineType: string;
  whatsappNumber: string;
  operatingHours: WeeklySchedule;
  tables: { count: number; capacity: number };
  avgDiningDuration: number; // in minutes
  bookingInterval: number; // in minutes
  maxDaysAdvance: number;
  policies: string;
  blockedDates: string[];
}

export interface Reservation {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  date: string; // ISO format
  time: string; // HH:mm format
  partySize: number;
  specialRequests: string;
  status: ReservationStatus;
  createdAt: number;
  updatedAt: number;
}

export interface TimeSlot {
  time: string;
  availableCapacity: number;
  totalCapacity: number;
  status: 'available' | 'limited' | 'full';
}
