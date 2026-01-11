
import { Restaurant, Reservation } from '../types';
import { DEFAULT_RESTAURANT } from '../constants';

const STORAGE_KEYS = {
  RESTAURANTS: 'quicktable_restaurants',
  RESERVATIONS: 'quicktable_reservations',
};

export const storageService = {
  getRestaurants: (): Restaurant[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
    if (!data) {
      // Initialize with a default restaurant for demonstration
      const initial = [DEFAULT_RESTAURANT];
      localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  getRestaurantBySlug: (slug: string): Restaurant | undefined => {
    const restaurants = storageService.getRestaurants();
    return restaurants.find(r => r.slug === slug);
  },

  saveRestaurant: (restaurant: Restaurant) => {
    const restaurants = storageService.getRestaurants();
    const index = restaurants.findIndex(r => r.id === restaurant.id);
    if (index > -1) {
      restaurants[index] = restaurant;
    } else {
      restaurants.push(restaurant);
    }
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(restaurants));
  },

  getReservations: (restaurantId?: string): Reservation[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (!data) return [];
    const reservations: Reservation[] = JSON.parse(data);
    if (restaurantId) {
      return reservations.filter(r => r.restaurantId === restaurantId);
    }
    return reservations;
  },

  saveReservation: (reservation: Reservation) => {
    const reservations = storageService.getReservations();
    const index = reservations.findIndex(r => r.id === reservation.id);
    if (index > -1) {
      reservations[index] = reservation;
    } else {
      reservations.push(reservation);
    }
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  },

  updateReservationStatus: (id: string, status: Reservation['status']) => {
    const reservations = storageService.getReservations();
    const index = reservations.findIndex(r => r.id === id);
    if (index > -1) {
      reservations[index].status = status;
      reservations[index].updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    }
  }
};
