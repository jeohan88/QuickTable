
import { Reservation } from '../types.ts';

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbw0wNzLCC8inds7C4r1K4Oq01-bqaDkFr-cjalCNhvzxkVtLz-ehxoGWjj9rufFEy5x/exec';

export const webhookService = {
  /**
   * Sends reservation data to the Google Apps Script Webhook.
   * Note: GAS webhooks often require mode: 'no-cors' in browsers due to 
   * redirect policies, which means we won't see the response body but the 
   * request will reach the server.
   */
  sendReservation: async (reservation: Reservation, restaurantName: string) => {
    try {
      const payload = {
        ...reservation,
        restaurantName,
        source: 'QuickTable App',
        timestamp: new Date().toISOString()
      };

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // Essential for GAS webhooks to bypass CORS preflight issues
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Reservation data forwarded to spreadsheet webhook.');
      return true;
    } catch (error) {
      console.error('Failed to send data to webhook:', error);
      return false;
    }
  }
};
