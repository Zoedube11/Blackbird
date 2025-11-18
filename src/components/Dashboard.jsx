import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  Plus,
  Trash2,
  LayoutDashboard,
  BarChart2,
  Users,
  LogOut,
  Menu,
  Clock,
  Edit2,
  X,
  Search,
  UserPlus,
  UserX,
} from "lucide-react";

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 5));
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState("month");
  const [activeTab, setActiveTab] = useState("calendar"); 
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState("");

  const technicians = ["Naledi", "Mbali", "Nikki"];

  // Clients
  const [clients, setClients] = useState([
    { id: 1, name: "Sarah Johnson", phone: "082 123 4567", joined: "2024-03-15" },
    { id: 2, name: "Lerato Mokoena", phone: "071 555 8899", joined: "2024-06-22" },
    { id: 3, name: "Zoe Williams", phone: "063 444 1122", joined: "2025-01-10" },
    { id: 4, name: "Aaliyah Patel", phone: "084 777 9900", joined: "2025-02-28" },
    { id: 5, name: "Thandi Zungu", phone: "078 888 7766", joined: "2025-04-05" },
  ]);

  const [appointments, setAppointments] = useState({
    "2025-11-5": [
      { time: "09:00", title: "Sarah Johnson", clientId: 1, technician: "Naledi", service: "Manicures", color: "bg-pink-100 text-pink-700 border-pink-300", duration: "60", price: 250, endTime: "10:00" },
      { time: "11:00", title: "Lerato Mokoena", clientId: 2, technician: "Mbali", service: "Pedicures", color: "bg-blue-100 text-blue-700 border-blue-300", duration: "75", price: 300, endTime: "12:15" },
      { time: "13:00", title: "Zoe Williams", clientId: 3, technician: "Naledi", service: "Acrylics", color: "bg-purple-100 text-purple-700 border-purple-300", duration: "120", price: 450, endTime: "15:00" },
    ],
    "2025-11-6": [
      { time: "10:00", title: "Aaliyah Patel", clientId: 4, technician: "Nikki", service: "Lash Extensions", color: "bg-yellow-100 text-yellow-700 border-yellow-300", duration: "150", price: 600, endTime: "12:30" },
    ],
  });

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [newClient, setNewClient] = useState({ name: "", phone: "" });
  const [newAppointment, setNewAppointment] = useState({
    time: "", title: "", clientId: null, technician: "", service: "", color: ""
  });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const servicePricing = {
    Manicures: { price: 250, duration: 60 },
    Acrylics: { price: 450, duration: 120 },
    Pedicures: { price: 300, duration: 75 },
    "Lash Extensions": { price: 600, duration: 150 },
    "Eyebrow Services": { price: 180, duration: 45 },
    Waxing: { price: 200, duration: 30 },
    "Makeup Services": { price: 550, duration: 90 },
    "Men's Services": { price: 220, duration: 60 },
  };

  const serviceColors = {
    Manicures: "bg-pink-100 text-pink-700 border-pink-300",
    Acrylics: "bg-purple-100 text-purple-700 border-purple-300",
    Pedicures: "bg-blue-100 text-blue-700 border-blue-300",
    "Lash Extensions": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "Eyebrow Services": "bg-amber-100 text-amber-700 border-amber-300",
    Waxing: "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Makeup Services": "bg-red-100 text-red-700 border-red-300",
    "Men's Services": "bg-gray-100 text-gray-700 border-gray-300",
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && activeTab === "calendar") setView("day");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [activeTab]);

  // Client search
  useEffect(() => {
    if (!clientSearch.trim()) {
      setFilteredClients([]);
      return;
    }
    const matches = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
    setFilteredClients(matches);
  }, [clientSearch, clients]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) days.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, isCurrentMonth: true });
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) days.push({ day: i, isCurrentMonth: false });
    return days;
  };

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === "day") newDate.setDate(currentDate.getDate() + direction);
    else newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const formatDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const getAppointmentsForDay = (day) => {
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const allAppts = appointments[dateKey] || [];
    return selectedTechnician ? allAppts.filter(a => a.technician === selectedTechnician) : allAppts;
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setCurrentDate(clickedDate);
    setView("day");
    setActiveTab("calendar");
    setNewAppointment({ time: "", title: "", clientId: null, technician: selectedTechnician || "", service: "", color: "" });
    setClientSearch("");
    setShowModal(true);
  };

  const handleAppointmentClick = (e, dateKey, appointment, index) => {
    e.stopPropagation();
    const day = parseInt(dateKey.split("-")[2]);
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setCurrentDate(clickedDate);
    setView("day");
    setEditingAppointment({ dateKey, index });
    setNewAppointment(appointment);
    setShowModal(true);
  };

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    const client = { id: Date.now(), name: newClient.name.trim(), phone: newClient.phone || "", joined: new Date().toISOString().split("T")[0] };
    setClients(prev => [...prev, client]);
    setNewAppointment(prev => ({ ...prev, title: client.name, clientId: client.id }));
    setShowClientModal(false);
    setNewClient({ name: "", phone: "" });
  };

  const selectClient = (client) => {
    setNewAppointment(prev => ({ ...prev, title: client.name, clientId: client.id }));
    setClientSearch("");
    setFilteredClients([]);
  };

  const deleteClient = (clientId) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    setShowDeleteConfirm(null);
  };

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!selectedDate || !newAppointment.service || !newAppointment.time || !newAppointment.technician || !newAppointment.title) return;

    const dateKey = formatDateKey(selectedDate);
    const serviceInfo = servicePricing[newAppointment.service];
    const [hours, minutes] = newAppointment.time.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes);
    const end = new Date(start.getTime() + serviceInfo.duration * 60000);
    const endTime = end.toTimeString().slice(0, 5);

    const fullAppointment = {
      ...newAppointment,
      price: serviceInfo.price,
      endTime,
      color: serviceColors[newAppointment.service],
    };

    if (editingAppointment) {
      setAppointments(prev => ({
        ...prev,
        [dateKey]: prev[dateKey].map((a, i) => i === editingAppointment.index ? fullAppointment : a),
      }));
    } else {
      setAppointments(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), fullAppointment].sort((a, b) => a.time.localeCompare(b.time)),
      }));
    }

    setConfirmedAppointment({ ...fullAppointment, date: selectedDate });
    setShowConfirmation(true);
    setShowModal(false);
    setNewAppointment({ time: "", title: "", clientId: null, technician: selectedTechnician || "", service: "" });
    setClientSearch("");
    setEditingAppointment(null);
  };

  const handleDeleteAppointment = (dateKey, index) => {
    setAppointments(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, i) => i !== index),
    }));
  };

  const days = getDaysInMonth(currentDate);
  const timeSlots = [];
  for (let h = 8; h < 19; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
    if (h < 18) timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 shadow-sm ${collapsed ? "w-20" : "w-64"} flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
            <h1 className={`text-xl font-bold text-black ${collapsed ? "hidden" : "block"}`}>Blackbird</h1>
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <nav className="mt-6 space-y-1 px-3">
            <SidebarItem icon={<LayoutDashboard />} label="Dashboard" collapsed={collapsed} />
            <SidebarItem icon={<Calendar />} label="Calendar" collapsed={collapsed} active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} />
            <SidebarItem icon={<Users />} label="Clients" collapsed={collapsed} active={activeTab === "clients"} onClick={() => setActiveTab("clients")} />
            <SidebarItem icon={<BarChart2 />} label="Analytics" collapsed={collapsed} />
            <SidebarItem icon={<Settings />} label="Settings" collapsed={collapsed} />
          </nav>
        </div>
        <div className="border-t border-gray-200 px-3 py-4">
          <SidebarItem icon={<LogOut />} label="Logout" collapsed={collapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "calendar" && (
          <>
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                  <p className="text-sm text-gray-500">Manage your appointments and schedule</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Technician:</span>
                    <select value={selectedTechnician} onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black">
                      <option value="">All Technicians</option>
                      {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {!isMobile && (
                      <button onClick={() => setView("month")} className={`px-4 py-2 rounded-md text-sm font-medium transition ${view === "month" ? "bg-white shadow-sm" : ""}`}>Month</button>
                    )}
                    <button onClick={() => setView("day")} className={`px-4 py-2 rounded-md text-sm font-medium transition ${view === "day" ? "bg-white shadow-sm" : ""}`}>Day</button>
                  </div>
                  <button onClick={goToToday} className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50">Today</button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="font-semibold min-w-[220px] text-center">
                      {view === "day"
                        ? currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                        : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                      }
                    </span>
                    <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  <button onClick={() => handleDayClick(currentDate.getDate())} className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> <span>New Appointment</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Month view */}
                {view === "month" && !isMobile && (
                  <div className="p-6 overflow-x-auto">
                    <div className="grid grid-cols-7 gap-px mb-4 text-xs font-bold text-gray-500 uppercase">
                      {dayNames.map(d => <div key={d} className="text-center py-3">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                      {days.map((dayObj, i) => {
                        const dayAppointments = dayObj.isCurrentMonth ? getAppointmentsForDay(dayObj.day) : [];
                        const isTodayDate = dayObj.isCurrentMonth && isToday(dayObj.day);
                        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(dayObj.day).padStart(2, "0")}`;

                        return (
                          <div key={i} onClick={() => dayObj.isCurrentMonth && handleDayClick(dayObj.day)}
                            className={`min-h-32 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              !dayObj.isCurrentMonth ? "bg-gray-50 border-transparent"
                              : isTodayDate ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-md"
                              : dayAppointments.length ? "bg-white border-gray-200 hover:border-indigo-300"
                              : "bg-white border-gray-200 hover:border-gray-300"
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-sm font-semibold ${!dayObj.isCurrentMonth ? "text-gray-400" : isTodayDate ? "bg-sky-500 text-white w-7 h-7 rounded-full flex items-center justify-center" : "text-gray-700"}`}>
                                {dayObj.day}
                              </span>
                              {dayAppointments.length > 0 && dayObj.isCurrentMonth && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{dayAppointments.length}</span>}
                            </div>
                            <div className="space-y-1.5">
                              {dayAppointments.slice(0, 3).map((apt, idx) => (
                                <div key={idx} onClick={(e) => handleAppointmentClick(e, dateKey, apt, idx)}
                                  className={`${apt.color} border px-2 py-1.5 rounded-lg text-xs font-medium truncate flex justify-between items-center group hover:scale-105 transition-transform cursor-pointer shadow-sm`}>
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{apt.time} {apt.title}</span>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <Edit2 className="w-3 h-3" />
                                    <Trash2 className="w-3 h-3 text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(dateKey, idx); }} />
                                  </div>
                                </div>
                              ))}
                              {dayAppointments.length > 3 && <div className="text-xs text-gray-500 text-center">+{dayAppointments.length - 3} more</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Day view */}
                {view === "day" && (
                  <div className="max-w-5xl mx-auto">
                    <div className="px-8 py-6 border-b border-gray-200">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        {selectedTechnician && <span className="text-lg font-normal text-gray-600 ml-3">• {selectedTechnician}'s Schedule</span>}
                      </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {timeSlots.map((slot) => {
                        const dayAppts = getAppointmentsForDay(currentDate.getDate()).filter(a => a.time === slot);
                        const dateKey = formatDateKey(currentDate);
                        const hasAppointment = dayAppts.length > 0;

                        return (
                          <div key={slot} className="grid grid-cols-[100px_1fr] min-h-24 hover:bg-gray-50/50 transition-colors">
                            <div className="px-6 py-4 text-sm font-medium text-gray-500 border-r border-gray-100 flex items-center justify-end">
                              {slot}
                            </div>
                            <div className="px-6 py-4 cursor-pointer"
                              onClick={() => {
                                if (hasAppointment) return;
                                setSelectedDate(currentDate);
                                setNewAppointment(prev => ({ ...prev, time: slot, technician: selectedTechnician || technicians[0] }));
                                setShowModal(true);
                              }}>
                              {hasAppointment ? (
                                dayAppts.map((apt, i) => (
                                  <div key={i} onClick={(e) => { e.stopPropagation(); handleAppointmentClick(e, dateKey, apt, getAppointmentsForDay(currentDate.getDate()).indexOf(apt)); }}
                                    className={`${apt.color} border-l-4 px-5 py-4 rounded-r-xl shadow-sm hover:shadow transition-shadow`}>
                                    <div className="font-semibold text-gray-900">{apt.title}</div>
                                    <div className="text-sm text-gray-600">{apt.service} • {apt.technician}</div>
                                    <div className="text-xs text-gray-500 mt-1">{apt.time} – {apt.endTime} • R{apt.price}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="h-full"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Clients page */}
        {activeTab === "clients" && (
          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="px-8 py-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your client database</p>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  {clients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No clients yet. They will appear here automatically.</div>
                  ) : (
                    clients.map(client => (
                      <div key={client.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div>
                          <div className="font-semibold text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-600">{client.phone || "No phone"}</div>
                          <div className="text-xs text-gray-500 mt-1">Joined {new Date(client.joined).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                        </div>
                        <button onClick={() => setShowDeleteConfirm(client.id)}
                          className="p-3 hover:bg-red-100 rounded-lg text-red-600 hover:text-red-700 transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editingAppointment ? "Edit Appointment" : "New Appointment"}</h2>
              <button onClick={() => { setShowModal(false); setClientSearch(""); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <div className="relative">
                  <input type="text" placeholder="Search or type new name..." className="w-full px-3 py-2 border rounded-lg pl-10 focus:ring-2 focus:ring-black"
                    value={clientSearch || newAppointment.title}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setNewAppointment(prev => ({ ...prev, title: e.target.value, clientId: null }));
                    }} required />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
                {filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredClients.map(client => (
                      <button key={client.id} type="button" onClick={() => selectClient(client)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex justify-between">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.phone}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {clientSearch && filteredClients.length === 0 && clientSearch.length > 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                    <button type="button" onClick={() => { setNewClient({ name: clientSearch }); setShowClientModal(true); setClientSearch(""); }}
                      className="w-full text-left px-4 py-4 hover:bg-gray-50 flex items-center gap-3 text-black font-medium">
                      <UserPlus className="w-5 h-5" />
                      Create New Client: "{clientSearch}"
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={newAppointment.service}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, service: e.target.value }))} required>
                  <option value="">Select Service</option>
                  {Object.keys(serviceColors).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Technician</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={newAppointment.technician}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, technician: e.target.value }))} required>
                  <option value="">Select Technician</option>
                  {technicians.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input type="time" className="w-full px-3 py-2 border rounded-lg" value={newAppointment.time}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))} required />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setClientSearch(""); }} className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium">
                  {editingAppointment ? "Save Changes" : "Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Create New Client</h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full px-3 py-2 border rounded-lg" value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))} required autoFocus />
              <input type="tel" placeholder="Phone Number (optional)" className="w-full px-3 py-2 border rounded-lg" value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowClientModal(false)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserX className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Client?</h3>
            <p className="text-gray-600 mb-8">This will permanently remove this client.<br />Past appointments will keep their name.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
              <button onClick={() => deleteClient(showDeleteConfirm)} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && confirmedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-8">Your appointment has been successfully scheduled</p>
            <div className="bg-gray-50 rounded-xl p-6 space-y-4 text-left">
              <div className="flex justify-between"><span className="text-gray-600">Client</span><span className="font-semibold">{confirmedAppointment.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Service</span><span className="font-semibold">{confirmedAppointment.service}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Technician</span><span className="font-semibold">{confirmedAppointment.technician}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Date</span><span className="font-semibold">{confirmedAppointment.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Time</span><span className="font-semibold">{confirmedAppointment.time} – {confirmedAppointment.endTime}</span></div>
              <div className="flex justify-between border-t pt-4"><span className="text-lg font-semibold">Total Amount</span><span className="text-2xl font-bold text-black">R{confirmedAppointment.price}</span></div>
            </div>
            <button onClick={() => { setShowConfirmation(false); setConfirmedAppointment(null); }} className="mt-8 w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ icon, label, collapsed, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group ${active ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-semibold shadow-sm" : "hover:bg-gray-100 text-gray-700"}`}>
    <div className={`w-5 h-5 ${active ? "text-indigo-600" : "text-gray-600"}`}>{icon}</div>
    {!collapsed && <span className="text-sm">{label}</span>}
  </div>
);

export default Dashboard;