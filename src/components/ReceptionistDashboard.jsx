import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  CalendarDays,
  Users,
  LogOut,
  Search,
  UserPlus,
  Trash2,
  Undo2,
  X,
  Edit3,
  UserCog,
  Check,
  Menu,
  Circle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Scissors,
} from "lucide-react";

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

export default function ReceptionistDashboard({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTech, setSelectedTech] = useState("");
  const [availableTechs, setAvailableTechs] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState("daily");

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showTechModal, setShowTechModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [deletedBooking, setDeletedBooking] = useState(null);
  const [undoTimeout, setUndoTimeout] = useState(null);

  // Form States
  const [clientSearch, setClientSearch] = useState("");
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });
  const [newTech, setNewTech] = useState({ name: "", email: "", password: "", specialization: "" });
  const [bookingForm, setBookingForm] = useState({
    clientId: null,
    clientName: "",
    selectedServices: [],
    technician: "",
    time: "",
    date: formatDateKey(selectedDate),
  });
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }
      try {
        const [servicesRes, agentsRes, clientsRes, bookingsRes] = await Promise.all([
          fetch("/proxy-api/services/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/proxy-api/agents/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/proxy-api/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/proxy-api/bookings/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(
            data.map((s) => ({
              id: s.id,
              name: s.name,
              price: parseFloat(s.price),
              duration: s.duration_minutes,
              category: s.category || "General",
            }))
          );
        } else {
          throw new Error("Failed to fetch services");
        }

        if (agentsRes.ok) {
          const agents = await agentsRes.json();
          setAvailableTechs(agents.map(a => ({...a, active_status: a.active_status ?? true})));
        } else {
          throw new Error("Failed to fetch agents");
        }

        if (clientsRes.ok) {
          setClients(await clientsRes.json());
        } else {
          throw new Error("Failed to fetch clients");
        }

        if (bookingsRes.ok) {
          const text = await bookingsRes.text();
          try {
            const data = fixDecimalResponse(text);
            if (!Array.isArray(data)) {
              console.error("Error fetching all bookings:", data);
            } else {
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
                  clientId: b.client.id,
                  services: b.services.map((s) => s.name),
                  technician: b.agent?.name || "Auto-Assigned",
                  technicianId: b.agent?.id,
                  totalPrice: price,
                  totalDuration: b.services.reduce((sum, s) => sum + s.duration_minutes, 0),
                  status: b.status,
                });
                return acc;
              }, {});
              setBookings(grouped);
            }
          } catch (parseErr) {
            console.error("Error parsing bookings response:", parseErr);
            throw parseErr;
          }
        } else {
          console.error("Bookings fetch failed with status:", bookingsRes.status);
          throw new Error("Failed to fetch bookings");
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
        setToast({ type: 'error', message: err.message || "Failed to load data" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return [];
    return clients.filter(
      (c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone?.includes(clientSearch)
    );
  }, [clientSearch, clients]);

  const totalPrice = bookingForm.selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = bookingForm.selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedBookings = useMemo(() => {
    return (bookings[selectedDateKey] || [])
      .filter((b) => !selectedTech || b.technician === selectedTech)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, selectedDateKey, selectedTech]);

  const groupedServices = useMemo(() => {
    return services.reduce((acc, service) => {
      const cat = service.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {});
  }, [services]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 9); 

  const changeDate = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
    setBookingForm((prev) => ({ ...prev, date: formatDateKey(newDate) }));
  };

  const setCustomDate = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    setBookingForm((prev) => ({ ...prev, date: formatDateKey(newDate) }));
    setShowDatePicker(false);
  };

  if (loading) {
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

  const addClient = async () => {
    if (!newClient.name.trim() || !newClient.phone.trim()) return setToast({type: 'error', message: "Name and phone required"});
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch("/proxy-api/clients/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newClient.name.trim(),
          phone: newClient.phone.trim(),
          email: newClient.email.trim() || null,
        }),
      });
      if (res.ok) {
        const client = await res.json();
        setClients((prev) => [...prev, client]);
        setBookingForm((prev) => ({ ...prev, clientId: client.id, clientName: client.name }));
        setNewClient({ name: "", phone: "", email: "" });
        setShowClientModal(false);
        setClientSearch("");
        setToast({type: 'success', message: "Client added successfully"});
      } else {
        const err = await res.json();
        setToast({type: 'error', message: err.detail || "Failed to add client"});
      }
    } catch {
      setToast({type: 'error', message: "Network error"});
    }
  };

const addTechnician = async () => {
  const { name, email, password, specialization } = newTech;
  if (!name.trim() || !email.trim() || !password.trim()) return setToast({type: 'error', message: "Name, email and password are required"});
  const token = localStorage.getItem("access_token");
  try {
    const res = await fetch("/proxy-api/agents/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password,
        specialization: specialization.trim() || null,  
        active_status: true,
        role: "agent"  
      }),
    });
    if (!res.ok) {
      const errData = await res.json(); 
      setToast({type: 'error', message: errData.detail || "Failed to add technician: " + res.status});
      return;
    }
    const agent = await res.json();
    setAvailableTechs((prev) => [...prev, {...agent, active_status: true}]);
    setNewTech({ name: "", email: "", password: "", specialization: "" });
    setShowTechModal(false);
    setToast({type: 'success', message: "Technician added successfully!"});
  } catch (error) {
    setToast({type: 'error', message: "Network error — is your backend running?"});
  }
};

  const selectClient = (client) => {
    setBookingForm((prev) => ({ ...prev, clientId: client.id, clientName: client.name }));
    setClientSearch("");
  };

  const toggleService = (service) => {
    setBookingForm((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.some((s) => s.id === service.id)
        ? prev.selectedServices.filter((s) => s.id !== service.id)
        : [...prev.selectedServices, service],
    }));
  };
const confirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.clientId || bookingForm.selectedServices.length === 0 || !bookingForm.time) {
      setToast({type: 'error', message: "Please select client, service(s), and time"});
      return;
    }
    const token = localStorage.getItem("access_token");
    const isEdit = !!editingBooking;
    
    if (isEdit) {
      setToast({type: 'error', message: "Editing bookings is not supported. Please cancel and create a new booking."});
      return;
    }
    
    const startDateTime = new Date(`${bookingForm.date}T${bookingForm.time}:00`);
    
    const payload = {
      client_id: bookingForm.clientId,
      start_time: startDateTime.toISOString(),
      services: bookingForm.selectedServices.map((s) => ({ service_id: s.id })),
    };
    
    // Handle technician selection
    if (bookingForm.technician && bookingForm.technician !== "auto" && bookingForm.technician !== "") {
      const tech = availableTechs.find((t) => t.name === bookingForm.technician);
      if (tech) {
        payload.agent_id = tech.id;
      } else {
        payload.agent_id = null;
      }
    } else {
      payload.agent_id = null;
    }
    
    console.log("📤 Booking payload:", payload);
    
    try {
      const res = await fetch("/proxy-api/bookings/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Booking failed:", res.status, text);
        let errDetail;
        try {
          const err = fixDecimalResponse(text);
          errDetail = err.detail || err.message || "Unknown error";
        } catch {
          errDetail = text || "Failed to process response";
        }
        if (errDetail.includes("not available")) {
          setToast({type: 'error', message: "Agent is not available at this time. Please choose a different time or agent."});
        } else if (errDetail.includes("No agents are available")) {
          setToast({type: 'error', message: "No agents are available at this time. Please try a different time."});
        } else if (errDetail.includes("conflict")) {
          setToast({type: 'error', message: "Booking conflict detected. Please adjust the time."});
        } else {
          setToast({type: 'error', message: errDetail});
        }
        return;
      }
      
      const text = await res.text();
      console.log("✅ Raw response:", text);
      const data = fixDecimalResponse(text);
      console.log("✅ Parsed booking data:", data);
      
      if (Array.isArray(data) && data.length === 0) {
        console.warn("⚠️ Backend returned empty array. Refreshing bookings...");
        setToast({type: 'info', message: "Booking may have been created. Refreshing..."});
        
        try {
          const bookingsRes = await fetch("/proxy-api/bookings/", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (bookingsRes.ok) {
            const allBookingsText = await bookingsRes.text();
            const allBookings = fixDecimalResponse(allBookingsText);
            
            if (Array.isArray(allBookings)) {
              const grouped = allBookings.reduce((acc, b) => {
                const dateKey = new Date(b.start_time).toISOString().split("T")[0];
                if (!acc[dateKey]) acc[dateKey] = [];
                const price = typeof b.total_price === "string" ? parseFloat(b.total_price) : b.total_price || 0;
                acc[dateKey].push({
                  id: b.id,
                  start_time: b.start_time,
                  time: new Date(b.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  hour: new Date(b.start_time).getHours(),
                  client: b.client.name,
                  clientId: b.client.id,
                  services: b.services.map((s) => s.name),
                  technician: b.agent?.name || "Auto-Assigned",
                  technicianId: b.agent?.id,
                  totalPrice: price,
                  totalDuration: b.services.reduce((sum, s) => sum + s.duration_minutes, 0),
                  status: b.status,
                });
                return acc;
              }, {});
              setBookings(grouped);
              setToast({type: 'success', message: "Bookings refreshed"});
            }
          }
        } catch (refreshErr) {
          console.error("Failed to refresh bookings:", refreshErr);
        }
        
        setShowBookingModal(false);
        resetForm();
        return;
      }
      
      if (!data || !data.id) {
        setToast({type: 'error', message: "Invalid response from server"});
        console.error("❌ Invalid data:", data);
        return;
      }

      const dateKey = bookingForm.date;
      const backendPrice = typeof data.total_price === "string" ? parseFloat(data.total_price) : data.total_price;
      const formattedStart = new Date(data.start_time);
      const formatted = {
        id: data.id,
        start_time: data.start_time,
        time: formattedStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        hour: formattedStart.getHours(),
        client: data.client?.name || bookingForm.clientName || "Unknown Client",
        clientId: data.client?.id || bookingForm.clientId,
        services: data.services ? data.services.map((s) => s.name) : bookingForm.selectedServices.map((s) => s.name),
        technician: data.agent?.name || "Auto-Assigned",
        technicianId: data.agent?.id,
        totalPrice: backendPrice || 0,
        totalDuration: data.services
          ? data.services.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
          : totalDuration,
        status: data.status || "confirmed",
      };
      
      console.log("📅 Formatted booking for UI:", formatted);
      
      setBookings((prev) => {
        const dayBookings = prev[dateKey] || [];
        const updatedDay = [...dayBookings, formatted].sort((a, b) => a.time.localeCompare(b.time));
        return { ...prev, [dateKey]: updatedDay };
      });
      
      setConfirmedBooking({
        ...formatted,
        autoAssigned: !data.agent?.id || payload.agent_id === null,
        isEdit: false,
      });
      setShowConfirmation(true);
      setShowBookingModal(false);
      resetForm();
      setToast({type: 'success', message: "Booking created successfully"});
    } catch (err) {
      console.error("❌ Booking error:", err);
      setToast({type: 'error', message: `Booking failed: ${err.message}`});
    }
  };

  const resetForm = () => {
    setBookingForm({
      clientId: null,
      clientName: "",
      selectedServices: [],
      technician: "",
      time: "",
      date: formatDateKey(selectedDate),
    });
    setEditingBooking(null);
    setClientSearch("");
  };

  const deleteBooking = async (booking) => {
    let bookingDateKey = Object.entries(bookings).find(([, list]) => list.some((b) => b.id === booking.id))?.[0];
    if (!bookingDateKey) return setToast({type: 'error', message: "Could not find booking date"});

    if (booking.isMockData) {
      setBookings((prev) => ({
        ...prev,
        [bookingDateKey]: prev[bookingDateKey].map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)),
      }));
      setDeletedBooking({ booking, dateKey: bookingDateKey });
      clearTimeout(undoTimeout);
      setUndoTimeout(setTimeout(() => setDeletedBooking(null), 5000));
      setToast({type: 'info', message: "Booking cancelled (mock)"});
      return;
    }

    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`/proxy-api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to cancel booking");
      }
      setDeletedBooking({ booking, dateKey: bookingDateKey });
      setBookings((prev) => ({
        ...prev,
        [bookingDateKey]: prev[bookingDateKey].map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)),
      }));
      clearTimeout(undoTimeout);
      setUndoTimeout(setTimeout(() => setDeletedBooking(null), 5000));
      setToast({type: 'info', message: "Booking cancelled"});
    } catch (err) {
      setToast({type: 'error', message: `Failed to cancel: ${err.message}`});
    }
  };

  const undoDelete = async () => {
    if (!deletedBooking) return;
    const { booking, dateKey } = deletedBooking;
    if (booking.isMockData) {
      setBookings((prev) => ({
        ...prev,
        [dateKey]: prev[dateKey].map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b)),
      }));
      setDeletedBooking(null);
      setToast({type: 'success', message: "Undo successful"});
      return;
    }
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`/proxy-api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "confirmed" }),
      });
      setBookings((prev) => ({
        ...prev,
        [dateKey]: prev[dateKey].map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b)),
      }));
      setDeletedBooking(null);
      setToast({type: 'success', message: "Undo successful"});
    } catch {
      setToast({type: 'error', message: "Failed to undo"});
    }
  };

  const openEdit = (booking) => {
    const selected = services.filter((s) => booking.services.some((name) => name === s.name));
    setEditingBooking(booking);
    setBookingForm({
      clientId: booking.clientId,
      clientName: booking.client,
      selectedServices: selected,
      technician: booking.technician === "Auto-Assigned" ? "auto" : booking.technician,
      time: booking.time.slice(0, 5),
      date: selectedDateKey,
    });
    setShowBookingModal(true);
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-8 border-[#985f99]';
      case 'cancelled':
        return 'border-l-8 border-red-500 opacity-60 line-through';
      case 'completed':
        return 'border-l-8 border-[#6B5E50] opacity-80 text-[#6B5E50]';
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

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-[#F8F6F2] flex font-['Inter']" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Sidebar
          onLogout={onLogout}
          setShowTechModal={setShowTechModal}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          viewMode={viewMode}
          setViewMode={setViewMode}
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
            selectedDate={selectedDate}
            setShowBookingModal={setShowBookingModal}
            setIsSidebarOpen={setIsSidebarOpen}
            changeDate={changeDate}
            setShowDatePicker={setShowDatePicker}
          />
          <Main
            viewMode={viewMode}
            selectedTech={selectedTech}
            setSelectedTech={setSelectedTech}
            availableTechs={availableTechs}
            selectedBookings={selectedBookings}
            openEdit={openEdit}
            deleteBooking={deleteBooking}
            getStatusClasses={getStatusClasses}
            hours={hours}
            bookings={bookings}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setViewMode={setViewMode}
            groupedServices={groupedServices}
            setShowTechModal={setShowTechModal}
          />
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          editingBooking={editingBooking}
          clientSearch={clientSearch}
          setClientSearch={setClientSearch}
          filteredClients={filteredClients}
          selectClient={selectClient}
          setShowClientModal={setShowClientModal}
          groupedServices={groupedServices}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          toggleService={toggleService}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
          availableTechs={availableTechs}
          confirmBooking={confirmBooking}
          setShowBookingModal={setShowBookingModal}
          resetForm={resetForm}
        />
      )}

      {showClientModal && (
        <ClientModal
          newClient={newClient}
          setNewClient={setNewClient}
          addClient={addClient}
          setShowClientModal={setShowClientModal}
        />
      )}

      {showTechModal && (
        <TechModal
          newTech={newTech}
          setNewTech={setNewTech}
          addTechnician={addTechnician}
          setShowTechModal={setShowTechModal}
        />
      )}

      {showConfirmation && confirmedBooking && (
        <ConfirmationModal
          confirmedBooking={confirmedBooking}
          setShowConfirmation={setShowConfirmation}
        />
      )}

      {deletedBooking && (
        <UndoToast undoDelete={undoDelete} />
      )}

      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-xl ${getToastClasses(toast.type)} z-50`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-4 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showDatePicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 lg:p-10 w-full max-w-md shadow-2xl border border-[#D4AF87]/30">
            <h2 className="text-2xl lg:text-3xl font-['Playfair_Display'] text-[#985f99] mb-6 lg:mb-8">Select Date</h2>
            <input
              type="date"
              onChange={setCustomDate}
              className="w-full border border-[#D4AF87]/40 p-4 lg:p-5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base lg:text-lg"
            />
            <button
              onClick={() => setShowDatePicker(false)}
              className="mt-4 w-full py-4 lg:py-5 border-2 border-[#D4AF87]/50 text-[#985f99] rounded-2xl hover:bg-[#f0ebe3] transition text-base lg:text-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}


const Sidebar = ({ onLogout, setShowTechModal, isSidebarOpen, setIsSidebarOpen, viewMode, setViewMode }) => (
  <aside
    className={`fixed inset-y-0 left-0 w-72 bg-[#F8F6F2]/95 lg:bg-white/95 backdrop-blur-2xl shadow-2xl border-r border-[#D4AF87]/20 z-50 transform transition-transform duration-300 ease-in-out ${
      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="p-6 border-b border-[#D4AF87]/20 relative"> 
      <h1 className="text-3xl font-['Playfair_Display'] text-[#985f99]">Blackbird Spa</h1>
      <p className="text-[#6B5E50] mt-1 text-sm">Reception</p> 
      <button
        className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-[#985f99]"
        onClick={() => setIsSidebarOpen(false)}
      >
        <X className="w-7 h-7" /> 
      </button>
    </div>
    <nav className="p-4 space-y-2"> 
      <button 
        onClick={() => setViewMode("daily")}
        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 transition ${viewMode === "daily" ? "bg-[#985f99] text-white shadow-lg" : "hover:bg-[#985f99]/5 text-[#985f99]"}`}
      >
        <CalendarDays className="w-5 h-5" /> Schedule
      </button>
      <button 
        onClick={() => setViewMode("monthly")}
        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 transition ${viewMode === "monthly" ? "bg-[#985f99] text-white shadow-lg" : "hover:bg-[#985f99]/5 text-[#985f99]"}`}
      >
        <Calendar className="w-5 h-5" /> Monthly Bookings
      </button>
      <button 
        onClick={() => setViewMode("services")}
        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 transition ${viewMode === "services" ? "bg-[#985f99] text-white shadow-lg" : "hover:bg-[#985f99]/5 text-[#985f99]"}`}
      >
        <Scissors className="w-5 h-5" /> Services
      </button>
      <button 
        onClick={() => setViewMode("agents")}
        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-3 transition ${viewMode === "agents" ? "bg-[#985f99] text-white shadow-lg" : "hover:bg-[#985f99]/5 text-[#985f99]"}`}
      >
        <UserCog className="w-5 h-5" /> Technicians
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

const Header = ({ user, selectedDate, setShowBookingModal, setIsSidebarOpen, changeDate, setShowDatePicker }) => (
  <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-[#D4AF87]/20 p-4 lg:p-8">
    <div className="flex justify-between items-center">
      {/* Menu Button */}
      <button
        className="text-[#985f99] p-2 flex-shrink-0"
        onClick={() => setIsSidebarOpen(prev => !prev)}
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 px-4 lg:px-6 text-left">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-['Playfair_Display'] text-[#985f99] leading-tight">
          Hi, {user.name}
        </h2>
        <p className="hidden sm:block text-[#6B5E50] text-sm sm:text-base lg:text-lg mt-1">
          {selectedDate.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 sm:p-3 bg-[#f0ebe3] rounded-full hover:bg-[#D4AF87]/20 transition"
        >
          <ChevronLeft className="w-6 sm:w-7 h-6 sm:h-7 text-[#985f99]" />
        </button>

        <button
          onClick={() => setShowDatePicker(true)}
          className="p-2 sm:p-3 bg-[#f0ebe3] rounded-full hover:bg-[#D4AF87]/20 transition"
        >
          <Calendar className="w-6 sm:w-7 h-6 sm:h-7 text-[#985f99]" />
        </button>

        <button
          onClick={() => changeDate(1)}
          className="p-2 sm:p-3 bg-[#f0ebe3] rounded-full hover:bg-[#D4AF87]/20 transition"
        >
          <ChevronRight className="w-6 sm:w-7 h-6 sm:h-7 text-[#985f99]" />
        </button>

        <button
          onClick={() => setShowBookingModal(true)}
          className="p-2 sm:px-5 sm:py-3 bg-[#985f99] text-white rounded-full sm:rounded-2xl flex items-center gap-2 hover:bg-[#985f99]/90 transition shadow-lg hover:shadow-xl text-base font-medium"
        >
          <Plus className="w-6 sm:w-5 h-6 sm:h-5" />
          <span className="hidden sm:inline">New Booking</span>
        </button>
      </div>
    </div>
  </header>
);

const Main = ({ viewMode, selectedTech, setSelectedTech, availableTechs, selectedBookings, openEdit, deleteBooking, getStatusClasses, hours, bookings, selectedDate, setSelectedDate, setViewMode, groupedServices, setShowTechModal }) => (
  <main className="p-4 bg-[#F8F6F2] min-h-screen"> 
    <div className="max-w-7xl mx-auto">
      <select
        value={selectedTech}
        onChange={(e) => setSelectedTech(e.target.value)}
        className="mb-6 w-full px-4 py-3 rounded-2xl border border-[#D4AF87]/30 bg-white/70 backdrop-blur focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-[#985f99] text-base" 
      >
        <option value="">All Technicians</option>
        {availableTechs.map((t) => (
          <option key={t.id} value={t.name}>
            {t.name} {t.active_status ? "●" : "○"}
          </option>
        ))}
      </select>

      {viewMode === "daily" ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4AF87]/20 p-4"> 
          <h3 className="text-xl font-['Playfair_Display'] text-[#985f99] mb-6">Calendar</h3> 

          {selectedBookings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-[#6B5E50] font-light">A quiet day in the sanctuary</p> 
            </div>
          ) : (
            <div className="space-y-6">
              {hours.map((hour) => {
                const hourBookings = selectedBookings.filter((b) => b.hour === hour && b.status !== 'cancelled');
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
                                <p className="mt-1 text-sm">with {booking.technician}</p>
                              </div>
                              <div className="flex justify-between mt-2">
                                <div className="text-xl font-bold text-[#D4AF87]">R{booking.totalPrice.toFixed(2)}</div>
                                <p className="text-sm text-[#6B5E50]">{booking.totalDuration} minutes</p> 
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"> 
                              <button
                                onClick={() => openEdit(booking)}
                                className="px-4 py-2 bg-[#985f99] text-white rounded-xl hover:bg-[#985f99]/90 flex items-center gap-2 font-medium shadow-lg text-sm" 
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBooking(booking)}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 font-medium shadow-lg text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                Cancel
                              </button>
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
      ) : viewMode === "monthly" ? (
        <MonthlyCalendar
          bookings={bookings}
          selectedDate={selectedDate}
          selectedTech={selectedTech}
          setSelectedDate={setSelectedDate}
          setViewMode={setViewMode}
        />
      ) : viewMode === "services" ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4AF87]/20 p-4"> 
          <h3 className="text-xl font-['Playfair_Display'] text-[#985f99] mb-6">Services</h3>
          {Object.keys(groupedServices).map((category) => (
            <div key={category} className="mb-8">
              <h4 className="text-lg font-medium text-[#6B5E50] mb-4">{category}</h4>
              <div className="space-y-4">
                {groupedServices[category].map((service) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-3xl bg-gradient-to-r from-white to-[#f0ebe3]/50 shadow-md"
                  >
                    <p className="text-base font-medium text-[#985f99]">{service.name}</p>
                    <div className="flex justify-between text-[#6B5E50] text-sm">
                      <span>Price: R{service.price.toFixed(2)}</span>
                      <span>Duration: {service.duration} minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "agents" ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4AF87]/20 p-4"> 
          <h3 className="text-xl font-['Playfair_Display'] text-[#985f99] mb-6">Technicians</h3>
          <button
            onClick={() => setShowTechModal(true)}
            className="mb-6 w-full py-4 bg-[#985f99] text-white rounded-3xl flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Technician
          </button>
          <div className="space-y-4 mb-8">
            {availableTechs.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-3xl bg-gradient-to-r from-white to-[#f0ebe3]/50 shadow-md flex items-center gap-4"
              >
                <div className={`w-3 h-3 rounded-full ${agent.active_status ? "bg-green-500" : "bg-red-500"}`}></div>
                <div>
                  <p className="text-base font-medium text-[#985f99]">{agent.name}</p>
                  <p className="text-sm text-[#6B5E50]">{agent.email} - {agent.specialization || "General"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  </main>
);

const MonthlyCalendar = ({ bookings, selectedDate, selectedTech, setSelectedDate, setViewMode }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDate(new Date(year, month, day));
      setViewMode("daily");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4AF87]/20 p-4">
      <h3 className="text-xl font-['Playfair_Display'] text-[#985f99] mb-6">Monthly Calendar</h3>
      <div className="grid grid-cols-7 gap-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="font-bold text-[#985f99] text-sm">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (!day) return <div key={index} className="h-24" />;
          const dateKey = formatDateKey(new Date(year, month, day));
          const dayBookings = (bookings[dateKey] || []).filter(
            (b) => b.status !== 'cancelled' && (!selectedTech || b.technician === selectedTech)
          );
          return (
            <div
              key={index}
              className="border border-[#D4AF87]/20 rounded-lg p-1 min-h-24 flex flex-col cursor-pointer hover:bg-[#f0ebe3]"
              onClick={() => handleDayClick(day)}
            >
              <div className={`font-bold ${dayBookings.length > 0 ? 'text-[#985f99]' : 'text-[#6B5E50]'}`}>
                {day}
              </div>
              <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1">
                {dayBookings.map((b) => (
                  <div key={b.id} className="bg-[#985f99]/10 rounded p-1 truncate">
                    {b.time} - {b.client}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BookingModal = ({
  editingBooking,
  clientSearch,
  setClientSearch,
  filteredClients,
  selectClient,
  setShowClientModal,
  groupedServices,
  bookingForm,
  setBookingForm,
  toggleService,
  totalPrice,
  totalDuration,
  availableTechs,
  confirmBooking,
  setShowBookingModal,
  resetForm,
}) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 sm:p-4"> 
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-10 w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D4AF87]/30">
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h2 className="text-2xl font-['Playfair_Display'] text-[#985f99]">
          {editingBooking ? "Edit" : "New"} Booking
        </h2>
        <button
          onClick={() => {
            setShowBookingModal(false);
            resetForm();
          }}
          className="text-gray-500 hover:text-[#985f99]"
        >
          <X className="w-7 h-7" /> 
        </button>
      </div>
      <form onSubmit={confirmBooking} className="space-y-4 sm:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <label className="block text-base font-medium text-[#985f99] mb-2">Date</label>
            <input
              type="date"
              required
              className="w-full border border-[#D4AF87]/40 bg-white/80 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
              value={bookingForm.date}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="relative">
            <label className="block text-base font-medium text-[#985f99] mb-2">Client</label>
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full border border-[#D4AF87]/40 bg-white/80 p-3 rounded-2xl pl-10 focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
              value={clientSearch || bookingForm.clientName}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setBookingForm((prev) => ({ ...prev, clientName: e.target.value, clientId: null }));
              }}
            />
            <Search className="absolute left-3 top-10 text-[#6B5E50] w-5 h-5" /> 
            {filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-[#D4AF87]/30 rounded-2xl shadow-2xl max-h-64 overflow-auto">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => selectClient(client)}
                    className="w-full text-left px-4 py-3 hover:bg-[#f0ebe3] border-b last:border-b-0"
                  >
                    <div className="font-medium text-[#985f99]">{client.name}</div>
                    <div className="text-sm text-[#6B5E50]">{client.phone}</div> 
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowClientModal(true)}
              className="mt-3 text-[#D4AF87] hover:text-[#985f99] flex items-center gap-2 font-medium"
            >
              <UserPlus className="w-5 h-5" /> Add New Client
            </button>
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-[#985f99] mb-3">Services</label>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {Object.entries(groupedServices).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-['Playfair_Display'] text-lg text-[#985f99] mb-3">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((service) => {
                    const isSelected = bookingForm.selectedServices.some((s) => s.id === service.id);
                    return (
                      <label
                        key={service.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition duration-300 ${
                          isSelected ? "border-[#985f99] bg-[#985f99] text-white" : "border-[#D4AF87]/40 hover:border-[#D4AF87]"
                        }`} 
                      >
                        <div>
                          <div className="font-medium text-base">{service.name}</div>
                          <div className="text-sm opacity-80">R{service.price} • {service.duration} min</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleService(service)}
                          className="w-5 h-5 rounded text-[#985f99]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {totalPrice > 0 && (
            <div className="mt-4 p-3 bg-[#f0ebe3] rounded-2xl">
              <div className="flex justify-between text-xl font-['Playfair_Display'] text-[#985f99]">
                <span>Total</span>
                <span>R{totalPrice.toFixed(2)} • {totalDuration} min</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <label className="block text-base font-medium text-[#985f99] mb-2">Technician</label>
            <select
              className="w-full border border-[#D4AF87]/40 bg-white/80 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
              value={bookingForm.technician}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, technician: e.target.value }))}
            >
              <option value="">Select technician</option>
              <option value="auto">Auto-assign</option>
              {availableTechs.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-medium text-[#985f99] mb-2">Time</label>
            <input
              type="time"
              required
              className="w-full border border-[#D4AF87]/40 bg-white/80 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
              value={bookingForm.time}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, time: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowBookingModal(false);
              resetForm();
            }}
            className="flex-1 py-4 border-2 border-[#D4AF87]/50 text-[#985f99] rounded-2xl hover:bg-[#f0ebe3] transition duration-300 text-base font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-4 bg-[#985f99] text-white rounded-2xl hover:bg-[#985f99]/90 transition duration-300 text-base font-medium shadow-lg"
          >
            {editingBooking ? "Update Booking" : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ClientModal = ({ newClient, setNewClient, addClient, setShowClientModal }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-10 w-full h-full sm:h-auto sm:max-w-md shadow-2xl border border-[#D4AF87]/30">
      <h2 className="text-2xl font-['Playfair_Display'] text-[#985f99] mb-4 sm:mb-8">Add New Client</h2>
      <div className="space-y-3 sm:space-y-6">
        <input
          type="text"
          placeholder="Full Name"
          value={newClient.name}
          onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={newClient.phone}
          onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={newClient.email}
          onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setShowClientModal(false)}
            className="flex-1 py-4 border-2 border-[#D4AF87]/50 text-[#985f99] rounded-2xl hover:bg-[#f0ebe3] transition duration-300 text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={addClient}
            className="flex-1 py-4 bg-[#985f99] text-white rounded-2xl hover:bg-[#985f99]/90 transition duration-300 text-base font-medium shadow-lg"
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  </div>
);

const TechModal = ({ newTech, setNewTech, addTechnician, setShowTechModal }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-6 lg:p-10 w-full h-full sm:h-auto sm:max-w-md shadow-2xl border border-[#D4AF87]/30">
      <h2 className="text-2xl font-['Playfair_Display'] text-[#985f99] mb-4 sm:mb-8">Add New Technician</h2>
      <div className="space-y-3 sm:space-y-6">
        <input
          type="text"
          placeholder="Name"
          value={newTech.name}
          onChange={(e) => setNewTech((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <input
          type="email"
          placeholder="Email"
          value={newTech.email}
          onChange={(e) => setNewTech((prev) => ({ ...prev, email: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <input
          type="password"
          placeholder="Password"
          value={newTech.password}
          onChange={(e) => setNewTech((prev) => ({ ...prev, password: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <input
          type="text"
          placeholder="Specialization (optional)"
          value={newTech.specialization}
          onChange={(e) => setNewTech((prev) => ({ ...prev, specialization: e.target.value }))}
          className="w-full border border-[#D4AF87]/40 p-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF87]/30 text-base"
        />
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => {
              setShowTechModal(false);
              setNewTech({ name: "", email: "", password: "", specialization: "" });
            }}
            className="flex-1 py-4 border-2 border-[#D4AF87]/50 text-[#985f99] rounded-2xl hover:bg-[#f0ebe3] transition duration-300 text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={addTechnician}
            className="flex-1 py-4 bg-[#985f99] text-white rounded-2xl hover:bg-[#985f99]/90 transition duration-300 text-base font-medium shadow-lg"
          >
            Add Technician
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ConfirmationModal = ({ confirmedBooking, setShowConfirmation }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-0 sm:p-4">
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-12 max-w-md w-full h-full sm:h-auto text-center shadow-2xl border border-[#D4AF87]/30">
      <div className="w-24 h-24 bg-[#D4AF87]/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8">
        <Check className="w-12 h-12 text-[#D4AF87]" />
      </div>
      <h2 className="text-3xl font-['Playfair_Display'] text-[#985f99] mb-4 sm:mb-8">
        {confirmedBooking.isEdit ? "Booking Updated!" : "Booking Confirmed!"}
      </h2>
      <div className="bg-[#f0ebe3]/50 rounded-2xl p-4 sm:p-6 text-left space-y-3 sm:space-y-5">
        <div className="flex justify-between">
          <span className="text-[#6B5E50]">Client</span> {/* Darkened */}
          <span className="font-bold text-[#985f99]">{confirmedBooking.client}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B5E50]">Services</span>
          <span className="font-bold text-[#985f99]">{confirmedBooking.services.join(" + ")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B5E50]">Time</span>
          <span className="font-bold text-[#985f99]">{confirmedBooking.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B5E50]">Technician</span>
          <span className="font-bold text-[#985f99]">{confirmedBooking.technician}</span>
        </div>
        <div className="border-t pt-3 sm:pt-5 flex justify-between text-xl">
          <span className="font-bold text-[#985f99]">Total</span>
          <span className="font-bold text-[#D4AF87]">R{confirmedBooking.totalPrice.toFixed(2)}</span>
        </div>
      </div>
      <button
        onClick={() => setShowConfirmation(false)}
        className="mt-6 w-full py-4 bg-[#985f99] text-white rounded-2xl hover:bg-[#985f99]/90 text-lg font-medium shadow-lg transition duration-300"
      >
        Done
      </button>
    </div>
  </div>
);

const UndoToast = ({ undoDelete }) => (
  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#985f99] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 z-50">
    <span className="text-base font-medium">Booking cancelled</span>
    <button
      onClick={undoDelete}
      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl flex items-center gap-2 font-medium transition duration-300"
    >
      <Undo2 className="w-4 h-4" /> Undo
    </button>
  </div>
);
