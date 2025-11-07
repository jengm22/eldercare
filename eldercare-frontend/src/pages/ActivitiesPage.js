import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityService } from '../services/api';
import { Activity, Plus, CheckCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

const ActivitiesPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await activityService.getAll(patientId);
      setActivities(response.data);
    } catch (error) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (activityId, currentStatus) => {
    try {
      await activityService.update(activityId, { completed: !currentStatus });
      toast.success('Activity updated');
      fetchActivities();
    } catch (error) {
      toast.error('Failed to update activity');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Separate today's and past activities
  const today = new Date().toISOString().split('T')[0];
  const todayActivities = activities.filter(act => act.activity_date === today);
  const pastActivities = activities.filter(act => act.activity_date < today);
  const upcomingActivities = activities.filter(act => act.activity_date > today);

  const completedToday = todayActivities.filter(act => act.completed).length;
  const totalToday = todayActivities.length;
  const completionPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Activities & Exercise</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Add Activity
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Today's Progress</h3>
            <p className="text-green-100">
              {completedToday} of {totalToday} activities completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{Math.round(completionPercentage)}%</div>
            <p className="text-green-100 text-sm">Complete</p>
          </div>
        </div>
        <div className="mt-4 bg-green-400 bg-opacity-30 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Today's Activities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Today's Activities</h3>
        <div className="grid gap-4">
          {todayActivities.length > 0 ? (
            todayActivities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => handleToggleComplete(activity.id, activity.completed)}
                      className={`p-3 rounded-lg transition-all ${
                        activity.completed
                          ? 'bg-green-100'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {activity.completed ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <Circle className="text-gray-400" size={24} />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${
                        activity.completed ? 'line-through text-gray-500' : ''
                      }`}>
                        {activity.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{activity.duration}</p>
                      {activity.notes && (
                        <p className="text-gray-500 text-sm mt-1">{activity.notes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(activity.id, activity.completed)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activity.completed
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {activity.completed ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Activity className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No activities scheduled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Activities */}
      {upcomingActivities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Activities</h3>
          <div className="grid gap-3">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Activity className="text-blue-600" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold">{activity.name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.activity_date).toLocaleDateString()} • {activity.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Activities */}
      {pastActivities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Past Activities</h3>
          <div className="grid gap-3">
            {pastActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="bg-gray-50 rounded-lg p-4 opacity-75">
                <div className="flex items-center gap-3">
                  {activity.completed ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <Circle className="text-gray-400" size={20} />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-700">{activity.name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.activity_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;