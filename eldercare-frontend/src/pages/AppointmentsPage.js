import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/api';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  X, 
  Edit2, 
  Trash2,
  ExternalLink,
  Filter,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    type: '',
    doctor: '',
    appointment_date: '',
    appointment_time: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await appointmentService.getAll(patientId);
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.type || !formData.doctor || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const patientId = user.patientId || 1;
      
      if (editingAppointment) {
        // Update existing appointment
        await appointmentService.update(editingAppointment.id, formData);
        toast.success('Appointment updated successfully');
      } else {
        // Create new appointment
        await appointmentService.create({
          ...formData,
          patient_id: patientId,
          status: 'scheduled'
        });
        toast.success('Appointment scheduled successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to save appointment');
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      type: appointment.type,
      doctor: appointment.doctor,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      location: appointment.location || '',
      notes: appointment.notes || ''
    });
    setShowModal(true);
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentService.cancel(appointmentId);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await appointmentService.delete(appointmentId);
      toast.success('Appointment deleted');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      doctor: '',
      appointment_date: '',
      appointment_time: '',
      location: '',
      notes: ''
    });
    setEditingAppointment(null);
  };

  const getDaysUntil = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    const diffTime = appointmentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (daysUntil) => {
    if (daysUntil === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Today</span>;
    } else if (daysUntil === 1) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Tomorrow</span>;
    } else if (daysUntil <= 7) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">This Week</span>;
    }
    return null;
  };

  const getDirectionsLink = (location) => {
    const encodedLocation = encodeURIComponent(location);
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Separate and filter appointments
  const now = new Date();
  let filteredAppointments = appointments;
  
  if (filterType !== 'all') {
    filteredAppointments = appointments.filter(apt => 
      apt.type.toLowerCase().includes(filterType.toLowerCase())
    );
  }

  const upcomingAppointments = filteredAppointments
    .filter(apt => new Date(apt.appointment_date) >= now)
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    
  const pastAppointments = filteredAppointments
    .filter(apt => new Date(apt.appointment_date) < now)
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

  // Appointment types for filter
  const appointmentTypes = [...new Set(appointments.map(apt => apt.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Schedule Appointment
        </button>
      </div>

      {/* Filter */}
      {appointmentTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filterType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {appointmentTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  filterType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Upcoming Appointments ({upcomingAppointments.length})
        </h3>
        <div className="grid gap-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => {
              const daysUntil = getDaysUntil(apt.appointment_date);
              return (
                <div key={apt.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-md transition">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <Calendar className="text-blue-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{apt.type}</h3>
                            {getUrgencyBadge(daysUntil)}
                          </div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <span className="font-medium">Dr. {apt.doctor}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            {new Date(apt.appointment_date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-gray-600 flex items-center gap-1 justify-end mt-1">
                            <Clock size={16} />
                            {apt.appointment_time}
                          </p>
                        </div>
                      </div>
                      
                      {apt.location && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={16} />
                            {apt.location}
                          </p>
                          <a 
                            href={getDirectionsLink(apt.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            Get Directions
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      )}

                      {apt.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Notes:</span> {apt.notes}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleEdit(apt)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition"
                        >
                          <Edit2 size={14} />
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm transition"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-4">No upcoming appointments</p>
              <button 
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Schedule Your First Appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Past Appointments ({pastAppointments.length})
          </h3>
          <div className="grid gap-4">
            {pastAppointments.slice(0, 5).map((apt) => (
              <div key={apt.id} className="bg-gray-50 rounded-lg p-6 opacity-75 hover:opacity-100 transition">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gray-200">
                    <Calendar className="text-gray-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">{apt.type}</h3>
                        <p className="text-gray-600">Dr. {apt.doctor}</p>
                        {apt.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin size={14} />
                            {apt.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700">
                          {new Date(apt.appointment_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-sm">{apt.appointment_time}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(apt.id)}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pastAppointments.length > 5 && (
              <p className="text-center text-gray-500 text-sm">
                Showing 5 of {pastAppointments.length} past appointments
              </p>
            )}
          </div>
        </div>
      )}

      {/* Schedule/Edit Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {editingAppointment ? 'Reschedule Appointment' : 'Schedule New Appointment'}
                </h3>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="General Checkup">General Checkup</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Specialist">Specialist</option>
                    <option value="Lab Work">Lab Work</option>
                    <option value="Physical Therapy">Physical Therapy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Smith"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="appointment_time"
                      value={formData.appointment_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Medical Center Dr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any special instructions or notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingAppointment ? 'Update' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;