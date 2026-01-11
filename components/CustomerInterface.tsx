
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Users, Clock, Send, 
  MapPin, Phone, Info, ChevronRight, CheckCircle, User
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay, parse } from 'date-fns';
import { storageService } from '../services/storageService';
import { webhookService } from '../services/webhookService';
import { Restaurant, Reservation, TimeSlot, ReservationStatus } from '../types';
import { DAYS_OF_WEEK } from '../constants';

export const CustomerInterface: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const restaurant = useMemo(() => storageService.getRestaurantBySlug(slug || ''), [slug]);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Restaurant Not Found</h1>
          <p className="text-stone-600 mb-8">The restaurant page you're looking for doesn't exist or has moved.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  // Generate available time slots based on restaurant operating hours and existing bookings
  const timeSlots: TimeSlot[] = useMemo(() => {
    const dayName = format(selectedDate, 'eeee');
    const schedule = restaurant.operatingHours[dayName];
    
    if (schedule.closed) return [];

    const slots: TimeSlot[] = [];
    const openTime = parse(schedule.open, 'HH:mm', selectedDate);
    const closeTime = parse(schedule.close, 'HH:mm', selectedDate);
    
    // Total table-person capacity per slot
    const totalCapacity = restaurant.tables.count * restaurant.tables.capacity;
    
    const reservations = storageService.getReservations(restaurant.id)
      .filter(r => r.date === format(selectedDate, 'yyyy-MM-dd'));

    let current = openTime;
    while (isBefore(current, closeTime)) {
      const timeStr = format(current, 'HH:mm');
      
      // Basic occupancy logic: check how many people are already booked at this time
      // or within the dining duration window
      const occupiedAtThisTime = reservations.reduce((acc, r) => {
        const resTime = parse(r.time, 'HH:mm', selectedDate);
        const resEndTime = new Date(resTime.getTime() + restaurant.avgDiningDuration * 60000);
        
        if (isBefore(resTime, new Date(current.getTime() + 1)) && isBefore(current, resEndTime)) {
          return acc + r.partySize;
        }
        return acc;
      }, 0);

      const availableCapacity = totalCapacity - occupiedAtThisTime;
      const percentAvailable = (availableCapacity / totalCapacity) * 100;

      let status: 'available' | 'limited' | 'full' = 'available';
      if (availableCapacity < partySize) status = 'full';
      else if (percentAvailable < 30) status = 'limited';

      slots.push({
        time: timeStr,
        availableCapacity,
        totalCapacity,
        status
      });

      current = new Date(current.getTime() + restaurant.bookingInterval * 60000);
    }

    return slots;
  }, [selectedDate, restaurant, partySize]);

  const handleBook = async () => {
    if (!selectedTime || !customerName.trim()) return;

    // 1. Create the local reservation record
    const newReservation: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      restaurantId: restaurant.id,
      customerName: customerName.trim(),
      customerPhone: '', // Placeholder, they send via WhatsApp
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      partySize,
      specialRequests,
      status: ReservationStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 2. Save locally
    storageService.saveReservation(newReservation);

    // 3. Forward to Spreadsheet via Webhook
    await webhookService.sendReservation(newReservation, restaurant.name);

    // 4. Open WhatsApp
    const message = `Hello ${restaurant.name}! 🍽️

I'd like to make a reservation:

📅 Date: ${format(selectedDate, 'eeee, MMMM dd, yyyy')}
⏰ Time: ${selectedTime}
👥 Party Size: ${partySize} people
👤 Name: ${customerName.trim()}
${specialRequests ? `\n📝 Special Requests: ${specialRequests}` : ''}

Please confirm availability. Thank you!`;

    const waUrl = `https://wa.me/${restaurant.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    
    setIsBooked(true);
  };

  if (isBooked) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-display font-bold">Request Sent!</h1>
          <p className="text-stone-600">Your reservation request has been opened in WhatsApp. Please send the message to the restaurant to finalize your booking.</p>
          
          <div className="bg-stone-50 p-6 rounded-2xl text-left border border-stone-100">
            <h3 className="font-bold mb-2">What happens next?</h3>
            <ul className="text-sm space-y-3 text-stone-600">
              <li className="flex items-start">
                <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">1</span>
                <span>Send the pre-filled message on WhatsApp.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">2</span>
                <span>Wait for the restaurant to confirm.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-amber-100 text-amber-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5">3</span>
                <span>Enjoy your meal at {restaurant.name}!</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => setIsBooked(false)}
            className="w-full py-4 rounded-xl font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
          >
            Make Another Reservation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Section */}
      <div className="h-[40vh] bg-stone-900 relative overflow-hidden">
        <img 
          src={`https://picsum.photos/seed/${restaurant.slug}/1200/600`} 
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-amber-500 text-stone-900 text-xs font-bold rounded-full uppercase tracking-wider">{restaurant.cuisineType}</span>
              <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">{restaurant.name}</h1>
              <p className="text-stone-300 max-w-2xl">{restaurant.description}</p>
            </div>
            <div className="flex space-x-4 mb-2">
              <a href={`tel:${restaurant.whatsappNumber}`} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                <Phone className="w-6 h-6" />
              </a>
              <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                <MapPin className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Card */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Party Size */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#800020] rounded-2xl flex items-center justify-center text-white font-bold">1</div>
              <h2 className="text-2xl font-bold">Party Size</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5, 6, 8, 10].map(size => (
                <button
                  key={size}
                  onClick={() => setPartySize(size)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${
                    partySize === size 
                    ? 'bg-[#800020] text-white shadow-lg scale-105' 
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100'
                  }`}
                >
                  {size}
                </button>
              ))}
              <div className="flex items-center ml-2 text-stone-400 text-sm italic">
                {partySize > 6 && "For larger groups, we'll verify space availability."}
              </div>
            </div>
          </section>

          {/* Step 2: Date Selector */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#800020] rounded-2xl flex items-center justify-center text-white font-bold">2</div>
              <h2 className="text-2xl font-bold">Select Date</h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = addDays(new Date(), i);
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isDayClosed = restaurant.operatingHours[format(date, 'eeee')].closed;
                
                return (
                  <button
                    key={i}
                    disabled={isDayClosed}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`flex-shrink-0 w-20 h-28 rounded-3xl flex flex-col items-center justify-center transition-all border ${
                      isSelected 
                      ? 'bg-[#800020] text-white border-transparent shadow-lg scale-105' 
                      : isDayClosed
                        ? 'bg-stone-100 text-stone-300 border-stone-100 cursor-not-allowed opacity-50'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-medium mb-1 uppercase tracking-wider">{format(date, 'EEE')}</span>
                    <span className="text-2xl font-bold">{format(date, 'd')}</span>
                    <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">{format(date, 'MMM')}</span>
                    {isDayClosed && <span className="text-[8px] font-bold mt-1">CLOSED</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3: Time Slot Grid */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#800020] rounded-2xl flex items-center justify-center text-white font-bold">3</div>
              <h2 className="text-2xl font-bold">Available Times</h2>
            </div>
            {timeSlots.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                 <Clock className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                 <p className="text-stone-500 font-medium">No available slots for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    disabled={slot.status === 'full'}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`relative py-4 rounded-2xl font-bold text-center transition-all border ${
                      selectedTime === slot.time 
                      ? 'bg-[#800020] text-white border-transparent shadow-lg scale-105 z-10' 
                      : slot.status === 'full'
                        ? 'bg-stone-100 text-stone-300 border-stone-100 cursor-not-allowed opacity-50'
                        : slot.status === 'limited'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {slot.time}
                    {slot.status === 'limited' && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-widest shadow-sm">Almost Full</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sticky Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-stone-100">
              <h3 className="text-2xl font-bold mb-6 border-b border-stone-100 pb-4">Reservation Summary</h3>
              
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-xs text-stone-400 font-bold uppercase tracking-wider mb-2 flex items-center">
                    <User className="w-3 h-3 mr-1" /> Your Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#800020] outline-none transition-all font-semibold"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-[#800020]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Party Size</p>
                    <p className="font-bold text-lg">{partySize} People</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-[#800020]">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Date</p>
                    <p className="font-bold text-lg">{format(selectedDate, 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-[#800020]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Time</p>
                    <p className="font-bold text-lg">{selectedTime || 'Select a time'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs text-stone-400 font-bold uppercase tracking-wider mb-2">Special Requests (Optional)</label>
                <textarea 
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="Allergies, birthday surprise, etc."
                  rows={3}
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                />
              </div>

              <button 
                disabled={!selectedTime || !customerName.trim()}
                onClick={handleBook}
                className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all shadow-xl ${
                  (selectedTime && customerName.trim()) 
                  ? 'bg-[#800020] text-white hover:bg-rose-950 scale-[1.02] active:scale-95' 
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>Reserve via WhatsApp</span>
                <Send className="w-5 h-5" />
              </button>
              <p className="text-center text-[10px] text-stone-400 mt-4 uppercase tracking-widest font-bold">Syncs to sheet & opens WhatsApp</p>
            </div>

            <div className="bg-[#FFFDD0] rounded-3xl p-6 border border-amber-100">
               <div className="flex items-center space-x-2 mb-3 text-amber-700">
                 <Info className="w-5 h-5" />
                 <h4 className="font-bold">Reservation Policy</h4>
               </div>
               <p className="text-sm text-amber-800/80 leading-relaxed italic">
                 "{restaurant.policies}"
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
