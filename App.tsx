
import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout } from './components/Layout.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { CustomerInterface } from './components/CustomerInterface.tsx';
import { Utensils, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDD0] p-6 text-center">
    <div className="max-w-3xl space-y-12">
      <div className="flex flex-col items-center space-y-6">
        <div className="w-24 h-24 bg-[#800020] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-12 transition-transform hover:rotate-0">
          <Utensils className="w-12 h-12" />
        </div>
        <h1 className="text-6xl md:text-8xl font-display font-bold text-[#800020] tracking-tighter">QuickTable</h1>
        <p className="text-xl md:text-2xl text-stone-600 max-w-xl mx-auto font-medium">The simplest way for local restaurants to handle table reservations via WhatsApp.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <Link 
          to="/admin" 
          className="w-full md:w-auto px-10 py-5 bg-stone-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center group"
        >
          For Restaurants
          <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link 
          to="/restaurant/le-bistro-charmant" 
          className="w-full md:w-auto px-10 py-5 bg-[#D4AF37] text-stone-900 rounded-2xl font-bold text-lg hover:bg-[#c4a030] transition-all shadow-xl"
        >
          Live Demo
        </Link>
      </div>

      <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-stone-200">
        <div className="space-y-2">
          <h3 className="font-bold text-[#800020] text-lg">No Apps Needed</h3>
          <p className="text-stone-500 text-sm">Customers book directly from your link. WhatsApp handles the rest.</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-[#800020] text-lg">Personal Touch</h3>
          <p className="text-stone-500 text-sm">Communicate directly with guests to confirm their special requests.</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-[#800020] text-lg">Always Open</h3>
          <p className="text-stone-500 text-sm">Automate your availability so you don't miss calls while closed.</p>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <Layout isAdmin>
            <AdminPanel />
          </Layout>
        } />

        {/* Customer Routes */}
        <Route path="/restaurant/:slug" element={
          <Layout>
            <CustomerInterface />
          </Layout>
        } />
      </Routes>
    </Router>
  );
};

export default App;
