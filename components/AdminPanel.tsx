
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  Users, Calendar as CalendarIcon, Clock, CheckCircle, 
  XCircle, Filter, Search, Download, Plus, Save, X, MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { storageService } from '../services/storageService.ts';
import { webhookService } from '../services/webhookService.ts';
import { Restaurant, Reservation, ReservationStatus } from '../types.ts';
import { DAYS_OF_WEEK } from '../constants.tsx';

export const AdminPanel: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/reservations" element={<ReservationsList />} />
      <Route path="/settings" element={<RestaurantSettings />} />
    </Routes>
  );
};

const Dashboard: React.FC = () => {
  const [restaurant] = useState<Restaurant>(storageService.getRestaurants()[0]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const refreshData = () => {
    setReservations(storageService.getReservations(restaurant.id));
  };

  useEffect(() => {
    refreshData();
  }, [restaurant.id]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysReservations = reservations.filter(r => r.date === todayStr);
  const pendingCount = reservations.filter(r => r.status === ReservationStatus.PENDING).length;

  return (
    <div className="space-y-8 relative">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500">Welcome back to {restaurant.name}</p>
        </div>
        <div className="flex space-x-4">
           <button 
             onClick={() => setShowAddModal(true)}
             className="bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center hover:bg-black transition-colors shadow-md active:scale-95"
           >
             <Plus className="w-4 h-4 mr-2" /> Add Reservation
           </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-500" />} label="Today's Guests" value={todaysReservations.reduce((acc, r) => acc + r.partySize, 0).toString()} />
        <StatCard icon={<CalendarIcon className="text-amber-500" />} label="Today's Bookings" value={todaysReservations.length.toString()} />
        <StatCard icon={<Clock className="text-purple-500" />} label="Pending Requests" value={pendingCount.toString()} />
        <StatCard icon={<CheckCircle className="text-emerald-500" />} label="Confirmed Today" value={todaysReservations.filter(r => r.status === ReservationStatus.CONFIRMED).length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reservations */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Today's Schedule</h2>
            <Link to="/admin/reservations" className="text-amber-600 hover:underline text-sm font-medium">View All</Link>
          </div>
          <div className="space-y-4">
            {todaysReservations.length === 0 ? (
              <p className="text-stone-400 italic text-center py-8">No reservations scheduled for today.</p>
            ) : (
              todaysReservations.sort((a, b) => a.time.localeCompare(b.time)).map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center font-bold text-stone-600">
                      {r.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{r.customerName}</p>
                      <p className="text-sm text-stone-500">{r.time} • {r.partySize} guests</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    r.status === ReservationStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-700' :
                    r.status === ReservationStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h2 className="text-xl font-bold mb-6">Public Page</h2>
          <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 text-center">
            <p className="text-sm text-stone-600 mb-4">Share your unique booking link on social media and Google Business Profile.</p>
            <div className="flex items-center justify-center space-x-2 bg-white border border-stone-200 p-2 rounded mb-6">
               <code className="text-xs text-stone-500 overflow-hidden text-ellipsis whitespace-nowrap">
                 quicktable.app/restaurant/{restaurant.slug}
               </code>
            </div>
            <Link 
              to={`/restaurant/${restaurant.slug}`} 
              className="inline-block bg-[#800020] text-white px-6 py-2 rounded-lg font-semibold hover:bg-rose-900 transition-colors"
            >
              Preview Live Page
            </Link>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddReservationModal 
          restaurant={restaurant} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

interface AddReservationModalProps {
  restaurant: Restaurant;
  onClose: () => void;
  onSuccess: () => void;
}

const AddReservationModal: React.FC<AddReservationModalProps> = ({ restaurant, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '19:00',
    partySize: 2,
    specialRequests: '',
    sendWhatsApp: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReservation: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      restaurantId: restaurant.id,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      date: formData.date,
      time: formData.time,
      partySize: formData.partySize,
      specialRequests: formData.specialRequests,
      status: ReservationStatus.CONFIRMED,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 1. Save locally
    storageService.saveReservation(newReservation);

    // 2. Sync to Google Sheets
    await webhookService.sendReservation(newReservation, restaurant.name);

    // 3. Optional WhatsApp open
    if (formData.sendWhatsApp && formData.customerPhone) {
      const message = `Hello ${formData.customerName}! 🍽️

This is ${restaurant.name}. Your reservation has been confirmed:

📅 Date: ${format(parseISO(formData.date), 'eeee, MMMM dd, yyyy')}
⏰ Time: ${formData.time}
👥 Party Size: ${formData.partySize} people

We look forward to seeing you!`;

      const cleanPhone = formData.customerPhone.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="text-lg font-bold">New Manual Reservation</h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Guest Name</label>
              <input 
                required
                type="text" 
                value={formData.customerName}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input 
                required
                type="tel" 
                value={formData.customerPhone}
                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Date</label>
                <input 
                  required
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Time</label>
                <input 
                  required
                  type="time" 
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Party Size</label>
              <input 
                required
                type="number" 
                min="1"
                max={restaurant.tables.capacity * restaurant.tables.count}
                value={formData.partySize}
                onChange={e => setFormData({...formData, partySize: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" 
              />
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="send-wa"
                checked={formData.sendWhatsApp}
                onChange={e => setFormData({...formData, sendWhatsApp: e.target.checked})}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-stone-300 rounded"
              />
              <label htmlFor="send-wa" className="text-sm font-medium text-stone-700 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" />
                Send WhatsApp Confirmation
              </label>
            </div>
          </div>
          <div className="pt-4 flex space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-stone-300 rounded-lg font-bold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-black shadow-lg"
            >
              Save & Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReservationsList: React.FC = () => {
  const [restaurant] = useState<Restaurant>(storageService.getRestaurants()[0]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    setReservations(storageService.getReservations(restaurant.id));
  }, [restaurant.id]);

  const handleStatusChange = (id: string, status: ReservationStatus) => {
    storageService.updateReservationStatus(id, status);
    setReservations(storageService.getReservations(restaurant.id));
  };

  const handleContactWhatsApp = (r: Reservation) => {
    const cleanPhone = r.customerPhone.replace(/\D/g, '') || restaurant.whatsappNumber;
    const message = `Hello ${r.customerName}, this is ${restaurant.name} regarding your reservation for ${format(parseISO(r.date), 'MMM dd')} at ${r.time}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredReservations = reservations
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Reservations</h1>
          <p className="text-stone-500">Manage all customer booking requests</p>
        </div>
        <button className="text-stone-600 border border-stone-300 px-4 py-2 rounded-lg flex items-center hover:bg-white transition-colors">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center bg-stone-50/50">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select 
              className="rounded-lg border border-stone-300 py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value={ReservationStatus.PENDING}>Pending</option>
              <option value={ReservationStatus.CONFIRMED}>Confirmed</option>
              <option value={ReservationStatus.CANCELLED}>Cancelled</option>
              <option value={ReservationStatus.COMPLETED}>Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4 text-center">Party</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReservations.map(r => (
                <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-semibold text-stone-900">{r.customerName}</p>
                        <p className="text-sm text-stone-500">{r.customerPhone || 'Manual Entry'}</p>
                      </div>
                      <button 
                        onClick={() => handleContactWhatsApp(r)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                        title="Contact on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-stone-900">{format(parseISO(r.date), 'MMM dd, yyyy')}</p>
                    <p className="text-sm text-stone-500">{r.time}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 font-bold text-stone-700">
                      {r.partySize}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      r.status === ReservationStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-700' :
                      r.status === ReservationStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                      r.status === ReservationStatus.CANCELLED ? 'bg-rose-100 text-rose-700' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {r.status === ReservationStatus.PENDING && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(r.id, ReservationStatus.CONFIRMED)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Confirm">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(r.id, ReservationStatus.CANCELLED)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded" title="Cancel">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {r.status === ReservationStatus.CONFIRMED && (
                      <button 
                        onClick={() => handleStatusChange(r.id, ReservationStatus.COMPLETED)}
                        className="text-xs font-bold text-stone-400 hover:text-stone-900 uppercase transition-colors">
                        Mark Done
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">
                    No reservations matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RestaurantSettings: React.FC = () => {
  const [restaurant, setRestaurant] = useState<Restaurant>(storageService.getRestaurants()[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    storageService.saveRestaurant(restaurant);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Settings</h1>
          <p className="text-stone-500">Configure your restaurant profile and rules</p>
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-amber-500 text-stone-900 px-6 py-2 rounded-lg font-bold flex items-center hover:bg-amber-600 shadow-md transition-all active:scale-95"
        >
          {isSaving ? 'Saving...' : (
            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
          )}
        </button>
      </header>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
            <h2 className="text-xl font-bold border-b border-stone-100 pb-2">General Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  value={restaurant.name}
                  onChange={e => setRestaurant({...restaurant, name: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp Number</label>
                <input 
                  type="tel" 
                  value={restaurant.whatsappNumber}
                  onChange={e => setRestaurant({...restaurant, whatsappNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none" 
                  placeholder="+CountryCode Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Cuisine Type</label>
                <input 
                  type="text" 
                  value={restaurant.cuisineType}
                  onChange={e => setRestaurant({...restaurant, cuisineType: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Short Description</label>
                <textarea 
                   rows={3}
                   value={restaurant.description}
                   onChange={e => setRestaurant({...restaurant, description: e.target.value})}
                   className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
            <h2 className="text-xl font-bold border-b border-stone-100 pb-2">Capacity & Booking</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Total Tables</label>
                <input 
                  type="number" 
                  value={restaurant.tables.count}
                  onChange={e => setRestaurant({...restaurant, tables: {...restaurant.tables, count: parseInt(e.target.value)}})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Table Capacity</label>
                <input 
                  type="number" 
                  value={restaurant.tables.capacity}
                  onChange={e => setRestaurant({...restaurant, tables: {...restaurant.tables, capacity: parseInt(e.target.value)}})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Dining Duration (Min)</label>
                <select 
                  value={restaurant.avgDiningDuration}
                  onChange={e => setRestaurant({...restaurant, avgDiningDuration: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Interval (Min)</label>
                <select 
                  value={restaurant.bookingInterval}
                  onChange={e => setRestaurant({...restaurant, bookingInterval: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
            <h2 className="text-xl font-bold border-b border-stone-100 pb-2">Operating Hours</h2>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="flex items-center justify-between">
                  <span className="w-24 text-sm font-medium">{day}</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="time" 
                      disabled={restaurant.operatingHours[day].closed}
                      value={restaurant.operatingHours[day].open}
                      onChange={e => setRestaurant({
                        ...restaurant, 
                        operatingHours: {
                          ...restaurant.operatingHours, 
                          [day]: { ...restaurant.operatingHours[day], open: e.target.value }
                        }
                      })}
                      className="px-2 py-1 border border-stone-300 rounded disabled:bg-stone-100" 
                    />
                    <span>-</span>
                    <input 
                      type="time" 
                      disabled={restaurant.operatingHours[day].closed}
                      value={restaurant.operatingHours[day].close}
                      onChange={e => setRestaurant({
                        ...restaurant, 
                        operatingHours: {
                          ...restaurant.operatingHours, 
                          [day]: { ...restaurant.operatingHours[day], close: e.target.value }
                        }
                      })}
                      className="px-2 py-1 border border-stone-300 rounded disabled:bg-stone-100" 
                    />
                    <label className="ml-4 flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={restaurant.operatingHours[day].closed}
                        onChange={e => setRestaurant({
                          ...restaurant, 
                          operatingHours: {
                            ...restaurant.operatingHours, 
                            [day]: { ...restaurant.operatingHours[day], closed: e.target.checked }
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-xs text-stone-500">Closed</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-stone-200 space-y-4">
            <h2 className="text-xl font-bold border-b border-stone-100 pb-2">Policies</h2>
            <div>
              <textarea 
                 rows={4}
                 value={restaurant.policies}
                 onChange={e => setRestaurant({...restaurant, policies: e.target.value})}
                 className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-amber-500 focus:ring-2 outline-none"
                 placeholder="Deposit required, cancellation fee, etc."
              />
            </div>
          </section>
        </div>
      </form>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center space-x-4">
    <div className="p-3 bg-stone-50 rounded-lg">
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <div>
      <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
    </div>
  </div>
);
