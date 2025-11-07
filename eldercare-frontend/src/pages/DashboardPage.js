import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { medicationService, appointmentService, vitalService, activityService } from '../services/api';
import { AlertCircle, Calendar, Activity, Heart, Pill, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    medications: [],
    appointments: [],
    vitals: [],
    activities: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const patientId = user.patientId || 1;

      const [medsRes, appsRes, vitalsRes, activitiesRes] = await Promise.all([
        medicationService.getAll(patientId).catch(() => ({ data: [] })),
        appointmentService.getAll(patientId).catch(() => ({ data: [] })),
        vitalService.getAll(patientId).catch(() => ({ data: [] })),
        activityService.getAll(patientId).catch(() => ({ data: [] })),
      ]);

      setStats({
        medications: medsRes.data || [],
        appointments: appsRes.data || [],
        vitals: vitalsRes.data || [],
        activities: activitiesRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingAppointments = stats.appointments
    .filter(apt => new Date(apt.appointment_date) >= new Date())
    .slice(0, 3);

  const pendingMedications = stats.medications.slice(0, 3);
  const recentVitals = stats.vitals.slice(0, 4);
  const todayActivities = stats.activities.filter(
    act => act.activity_date === new Date().toISOString().split('T')[0]
  );
  const completedActivities = todayActivities.filter(act => act.completed).length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-blue-100">Here's what's happening with your care today</p>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendingMedications.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={24} />
              <div>
                <p className="font-semibold text-red-800">Medication Due</p>
                <p className="text-sm text-red-600">
                  {pendingMedications.length} medication{pendingMedications.length !== 1 ? 's' : ''} today
                </p>
              </div>
            </div>
          </div>
        )}

        {upcomingAppointments.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              <div>
                <p className="font-semibold text-blue-800">Upcoming Appointment</p>
                <p className="text-sm text-blue-600">
                  {upcomingAppointments[0].type} - {new Date(upcomingAppointments[0].appointment_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Activity className="text-green-600" size={24} />
            <div>
              <p className="font-semibold text-green-800">Daily Goals</p>
              <p className="text-sm text-green-600">
                {completedActivities} of {todayActivities.length} activities completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentVitals.slice(0, 4).map((vital, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">{vital.type.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-800">{vital.value}</p>
            <p className="text-xs text-green-600">Normal</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Pill className="text-blue-600" size={20} />
              Today's Medications
            </h3>
          </div>
          <div className="space-y-3">
            {pendingMedications.length > 0 ? (
              pendingMedications.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-gray-600">{med.dosage}</p>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Take
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">All medications taken! 🎉</p>
            )}
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Upcoming Appointments
            </h3>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt) => (
                <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{apt.type}</p>
                      <p className="text-sm text-gray-600">{apt.doctor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(apt.appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity className="text-blue-600" size={20} />
          Today's Activities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayActivities.length > 0 ? (
            todayActivities.map((activity) => (
              <div key={activity.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{activity.name}</p>
                  {activity.completed && <CheckCircle className="text-green-600" size={20} />}
                </div>
                <p className="text-sm text-gray-600">{activity.duration}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4 col-span-3">
              No activities scheduled for today
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;