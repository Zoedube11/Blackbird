import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  Plus,
  Search,
  Bell,
  User,
  Trash2,
  LayoutDashboard,
  BarChart2,
  Users,
  LogOut,
  Menu,
  Clock,
  Edit2,
  X,
} from "lucide-react";
import { select } from "framer-motion/client";

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 5));
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState("month");
  const [appointments, setAppointments] = useState({
    "2025-11-5": [
      { time: "09:00", title: "Walk-In", color: "bg-purple-100 text-purple-700 border-purple-300", type: "walk-in", duration: "30" },
      { time: "11:00", title: "John Doe", color: "bg-blue-100 text-blue-700 border-blue-300", type: "client", duration: "60" },
      { time: "12:15", title: "Lunch Break", color: "bg-amber-100 text-amber-700 border-amber-300", type: "personal", duration: "45" },
      { time: "13:00", title: "Jane Smith", color: "bg-blue-100 text-blue-700 border-blue-300", type: "client", duration: "90" },
      { time: "15:00", title: "Team Meeting", color: "bg-emerald-100 text-emerald-700 border-emerald-300", type: "meeting", duration: "30" },
    ],
    "2025-11-6": [
      { time: "10:00", title: "Sarah Johnson", color: "bg-blue-100 text-blue-700 border-blue-300", type: "client", duration: "60" },
      { time: "14:00", title: "Marketing Review", color: "bg-emerald-100 text-emerald-700 border-emerald-300", type: "meeting", duration: "45" },
    ],
    "2025-11-7": [
      { time: "09:30", title: "Mike Brown", color: "bg-blue-100 text-blue-700 border-blue-300", type: "client", duration: "60" },
    ],
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    time: "",
    title: "",
    technician: "",
    service: "",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    type: "client",
    duration: "60",
  });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

   // Service colors
  const serviceColors = {
    "Manicures": "bg-pink-100 text-pink-700 border-pink-300",
    "Acrylics": "bg-purple-100 text-purple-700 border-purple-300",
    "Pedicures": "bg-blue-100 text-blue-700 border-blue-300",
    "Lash Extensions": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "Eyebrow Services": "bg-amber-100 text-amber-700 border-amber-300",
    "Waxing": "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Makeup Services": "bg-red-100 text-red-700 border-red-300",
    "Men's Services": "bg-gray-100 text-gray-700 border-gray-300",
  };


  const appointmentTypes = [
    // { value: "client", label: "Client", color: "bg-blue-100 text-blue-700 border-blue-300" },
    // { value: "meeting", label: "Meeting", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    // { value: "personal", label: "Personal", color: "bg-amber-100 text-amber-700 border-amber-300" },
    // { value: "walk-in", label: "Walk-In", color: "bg-purple-100 text-purple-700 border-purple-300" },
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getAppointmentsForDay = (day) => {
    if (!day) return [];
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
    const dayAppointments = appointments[dateKey] || [];

    if (searchQuery) {
      return dayAppointments.filter(apt =>
        apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return dayAppointments;
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setEditingAppointment(null);
    setNewAppointment({
      time: "",
      title: "",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      type: "client",
      duration: "60",
    });
    setShowModal(true);
  };

  const handleAppointmentClick = (e, dateKey, appointment, index) => {
    e.stopPropagation();
    const day = parseInt(dateKey.split('-')[2]);
    setSelectedDate(day);
    setEditingAppointment({ dateKey, index });
    setNewAppointment(appointment);
    setShowModal(true);
  };

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${selectedDate}`;

    if (editingAppointment) {
      setAppointments((prev) => ({
        ...prev,
        [dateKey]: prev[dateKey].map((apt, i) =>
          i === editingAppointment.index ? newAppointment : apt
        ),
      }));
    } else {
      setAppointments((prev) => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newAppointment],
      }));
    }

    setNewAppointment({
      time: "",
      title: "",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      type: "client",
      duration: "60",
    });
    setEditingAppointment(null);
    setShowModal(false);
  };

  const handleDeleteAppointment = (dateKey, index) => {
    setAppointments((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, i) => i !== index),
    }));
  };

  const handleTypeChange = (type) => {
    const typeConfig = appointmentTypes.find(t => t.value === type);
    setNewAppointment({
      ...newAppointment,
      type,
      color: typeConfig.color,
    });
  };

  const getTotalAppointments = () => {
    return Object.values(appointments).flat().length;
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    let upcoming = 0;
    Object.entries(appointments).forEach(([dateKey, apts]) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      const aptDate = new Date(year, month - 1, day);
      if (aptDate >= today) {
        upcoming += apts.length;
      }
    });
    return upcoming;
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm
        ${collapsed ? "w-20" : "w-64"} flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
            <h1
              className={`text-xl font-bold text-black ${collapsed ? "hidden" : "block"}`}
            >
              Blackbird
            </h1>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <nav className="mt-6 space-y-1 px-3">
            <SidebarItem icon={<LayoutDashboard />} label="Dashboard" collapsed={collapsed} />
            <SidebarItem icon={<Calendar />} label="Calendar" collapsed={collapsed} active />
            <SidebarItem icon={<Users />} label="Clients" collapsed={collapsed} />
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
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your appointments and schedule</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              {showSearch && (
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              )}
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {showSearch ? <X className="w-5 h-5 text-gray-600" /> : <Search className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Appointments"
              value={getTotalAppointments()}
              icon={<Calendar className="w-5 h-5" />}
              color="bg-[#F80227]"
            />
            <StatCard
              title="Upcoming"
              value={getUpcomingAppointments()}
              icon={<Clock className="w-5 h-5" />}
              color="bg-[#FBB5F3]"
            />
            <StatCard
              title="This Month"
              value={Object.keys(appointments)
                .filter(key =>
                  key.startsWith(`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`)
                )
                .reduce((sum, key) => sum + appointments[key].length, 0)}
              icon={<BarChart2 className="w-5 h-5" />}
              color="bg-[#79ADDC]"
            />
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Controls */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                  Today
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                {/* Legend */}
                <div className="flex items-center space-x-3 mr-4">
                  {appointmentTypes.map(type => (
                    <div key={type.value} className="flex items-center space-x-1">
                      <div className={`w-3 h-3 rounded-full ${type.color.split(' ')[0]}`}></div>
                      <span className="text-xs text-gray-600">{type.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleDayClick(new Date().getDate())}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition flex items-center space-x-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Appointment</span>
                </button>

              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-px mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((dayObj, index) => {
                  const dayAppointments = dayObj.isCurrentMonth ? getAppointmentsForDay(dayObj.day) : [];
                  const isTodayDate = dayObj.isCurrentMonth && isToday(dayObj.day);
                  const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${dayObj.day}`;
                  const hasAppointments = dayAppointments.length > 0;

                  return (
                    <div
                      key={index}
                      onClick={() => dayObj.isCurrentMonth && handleDayClick(dayObj.day)}
                      className={`
                        min-h-32 p-3 rounded-xl transition-all duration-200 cursor-pointer border-2
                        ${!dayObj.isCurrentMonth
                          ? "bg-gray-50 border-transparent"
                          : isTodayDate
                            ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-md"
                            : hasAppointments
                              ? "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-lg"
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-sm font-semibold ${!dayObj.isCurrentMonth
                            ? "text-gray-400"
                            : isTodayDate
                              ? "bg-sky-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                              : "text-gray-700"
                            }`}
                        >
                          {dayObj.day}
                        </span>

                        {hasAppointments && dayObj.isCurrentMonth && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {dayAppointments.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {dayAppointments.slice(0, 3).map((apt, i) => (
                          <div
                            key={i}
                            onClick={(e) => handleAppointmentClick(e, dateKey, apt, i)}
                            className={`${apt.color} border px-2 py-1.5 rounded-lg text-xs font-medium truncate flex justify-between items-center group hover:scale-105 transition-transform cursor-pointer shadow-sm`}
                          >
                            <div className="flex items-center space-x-1 flex-1 min-w-0">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{apt.time} {apt.title}</span>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit2 className="w-3 h-3 hover:text-indigo-600" />
                              <Trash2
                                className="w-3 h-3 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAppointment(dateKey, i);
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>

                      {!hasAppointments && dayObj.isCurrentMonth && (
                        <div className="flex items-center justify-center h-full text-gray-300 opacity-0 hover:opacity-100 transition-opacity">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h2 className="text-lg font-semibold mb-4">
              {editingAppointment ? "Edit Appointment" : "Add Appointment"}
            </h2>

            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Service</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newAppointment.service || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      service: e.target.value,
                      color: serviceColors[e.target.value] || "bg-blue-100 text-blue-700 border-blue-300",
                    })
                  }
                  required
                >
                  <option value="">Select Service</option>
                  <option value="Manicures">Manicures (R100, 45-90 mins)</option>
                  <option value="Acrylics">Acrylics (R260, 60-120 mins)</option>
                  <option value="Pedicures">Pedicures (R200, 60-90 mins)</option>
                  <option value="Lash Extensions">Lash Extensions (R350, 90-150 mins)</option>
                  <option value="Eyebrow Services">Eyebrow Services (R100, 30-45 mins)</option>
                  <option value="Waxing">Waxing (R40+, 30-90 mins)</option>
                  <option value="Makeup Services">Makeup Services (R600, 60-90 mins)</option>
                  <option value="Men's Services">Men's Services (R250, 45-75 mins)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Technician</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newAppointment.technician || ""}
                  onChange={(e) => setNewAppointment({ ...newAppointment, technician: e.target.value })}
                  required
                >
                  <option value="">Select Technician</option>
                  <option value="Zoë">Zoë</option>
                  <option value="Alice">Alice</option>
                  <option value="Bob">Bob</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white bg-black rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  {editingAppointment ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const SidebarItem = ({ icon, label, collapsed, active }) => (
  <div
    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group ${active
      ? "bg-gradient-to-r from-white-50 to-white-50 text-white-700 font-semibold"
      : "hover:bg-gradient-to-r hover:from-white-100 hover:to-white-200 text-gray-700"
      }`}
  >
    <div
      className={`w-5 h-5 ${active
        ? "text-white-600"
        : "text-gray-600"
        } transition`}
    >
      {icon}
    </div>
    {!collapsed && <span className="text-sm">{label}</span>}
  </div>
);


const StatCard = ({ title, value, icon, color }) => {
  const colorClass = color.includes("bg-") ? color : `bg-gradient-to-br ${color}`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div
          className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center text-white shadow-md`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};


export default Dashboard;