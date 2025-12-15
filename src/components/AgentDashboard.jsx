import React, { useState, useEffect } from "react";
import { LogOut, X, Menu, CalendarDays } from "lucide-react";

export default function AgentDashboard({ user, onLogout }) {
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState({ bookings: true });
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const formatDateKey = (date) => date.toISOString().split("T")[0];
  const todayKey = formatDateKey(new Date());

  const fixDecimalResponse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      const fixed = text
        .replace(/Decimal\('([\d.]+)'\)/g, '"$1"')
        .replace(/Decimal\("([\d.]+)"\)/g, '"$1"');
      return JSON.parse(fixed);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Authentication required.");
        setLoading((prev) => ({ ...prev, bookings: false }));
        return;
      }

      try {
        const response = await fetch("/proxy-api/agents/me/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to load appointments");

        const text = await response.text();
        const data = fixDecimalResponse(text);

        const grouped = data.reduce((acc, b) => {
          const dateKey = new Date(b.start_time).toISOString().split("T")[0];
          if (!acc[dateKey]) acc[dateKey] = [];
          const price = typeof b.total_price === "string" ? parseFloat(b.total_price) : b.total_price || 0;
          acc[dateKey].push({
            id: b.id,
            start_time: b.start_time,
            time: new Date(b.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            hour: new Date(b.start_time).getHours(),
            client: b.client.name,
            services: b.services.map((s) => s.name),
            totalPrice: price,
            totalDuration: b.services.reduce((sum, s) => sum + s.duration_minutes, 0),
            status: b.status,
          });
          return acc;
        }, {});

        setBookings(grouped);
      } catch (err) {
        setError(err.message || "Failed to connect");
        setToast({ type: 'error', message: err.message || "Failed to load appointments" });
      } finally {
        setLoading((prev) => ({ ...prev, bookings: false }));
      }
    };

    fetchBookings();
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => i + 9); 

  const selectedBookings = (bookings[todayKey] || [])
    .sort((a, b) => a.time.localeCompare(b.time));

  const getStatusClasses = (status) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-8 border-green-500';
      case 'cancelled':
        return 'border-l-8 border-red-500 opacity-60 line-through';
      case 'completed':
        return 'border-l-8 border-gray-500 opacity-80 text-gray-500';
      default:
        return '';
    }
  };

  const getToastClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-[#985f99] text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-[#D4AF87] text-[#985f99]';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (Object.values(loading).some((l) => l)) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
        <div className="text-3xl font-light text-[#985f99]">Loading your sanctuary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
        <div className="text-xl text-red-600 bg-white/80 backdrop-blur px-10 py-6 rounded-3xl shadow-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] font-['Inter']" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-72' : ''}`}>
        <Header
          user={user}
          setIsSidebarOpen={setIsSidebarOpen}
          onLogout={onLogout}
        />
        <main className="p-4 bg-[#F8F6F2] min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4AF87]/20 p-4">
              <h3 className="text-xl font-['Playfair_Display'] text-[#985f99] mb-6">Today's Appointments</h3>

              {selectedBookings.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-[#6B5E50] font-light">A quiet day in the sanctuary</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {hours.map((hour) => {
                    const hourBookings = selectedBookings.filter((b) => b.hour === hour);
                    return (
                      <div key={hour} className="flex flex-col gap-4 border-b border-[#D4AF87]/20 pb-4 last:border-b-0 last:pb-0">
                        <div className="text-left text-[#6B5E50] font-medium text-base pt-2">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        <div className="space-y-4">
                          {hourBookings.length > 0 ? (
                            hourBookings.map((booking) => (
                              <div
                                key={booking.id}
                                className={`relative p-4 rounded-3xl bg-gradient-to-r from-white to-[#f0ebe3]/50 shadow-md hover:shadow-2xl transition-all duration-300 group ${getStatusClasses(booking.status)}`}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="text-2xl font-['Playfair_Display'] text-[#985f99]">{booking.time}</div>
                                  <p className="text-base font-medium text-[#985f99]">{booking.client}</p>
                                  <div className="text-[#6B5E50]">
                                    <p className="text-sm font-medium">{booking.services.join(" + ")}</p>
                                  </div>
                                  <div className="flex justify-between mt-2">
                                    <div className="text-xl font-bold text-[#D4AF87]">R{booking.totalPrice.toFixed(2)}</div>
                                    <p className="text-sm text-[#6B5E50]">{booking.totalDuration} minutes</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-[#6B5E50] italic text-base opacity-70">
                              No bookings
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-xl ${getToastClasses(toast.type)} z-50`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-4 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const Sidebar = ({ onLogout, isSidebarOpen, setIsSidebarOpen }) => (
  <aside
    className={`fixed inset-y-0 left-0 w-72 bg-[#F8F6F2]/95 lg:bg-white/95 backdrop-blur-2xl shadow-2xl border-r border-[#D4AF87]/20 z-50 transform transition-transform duration-300 ease-in-out ${
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="p-6 border-b border-[#D4AF87]/20 relative"> 
      <h1 className="text-3xl font-['Playfair_Display'] text-[#985f99]">Blackbird Spa</h1>
      <p className="text-[#6B5E50] mt-1 text-sm">Agent</p> 
      <button
        className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-[#985f99]"
        onClick={() => setIsSidebarOpen(false)}
      >
        <X className="w-7 h-7" /> 
      </button>
    </div>
    <nav className="p-4 space-y-2"> 
      <button 
        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 transition bg-[#985f99] text-white shadow-lg`}
      >
        <CalendarDays className="w-5 h-5" /> Appointments
      </button>
    </nav>
    <div className="absolute bottom-0 w-full p-4 border-t border-[#D4AF87]/20">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 text-red-700 hover:bg-red-50 px-4 py-4 rounded-2xl transition"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </div>
  </aside>
);

const Header = ({ user, setIsSidebarOpen, onLogout }) => (
  <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-[#D4AF87]/20 p-4 lg:p-8">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <button
        className="text-[#985f99] p-2 flex-shrink-0"
        onClick={() => setIsSidebarOpen(prev => !prev)}
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex-1 text-left">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-['Playfair_Display'] text-[#985f99] leading-tight">
          Hi, {user?.name || "Technician"}
        </h2>
        <p className="hidden sm:block text-[#6B5E50] text-sm sm:text-base lg:text-lg mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="p-3 bg-[#f0ebe3] rounded-full hover:bg-[#D4AF87]/20 transition"
      >
        <LogOut className="w-6 h-6 text-[#985f99]" />
      </button>
    </div>
  </header>
);