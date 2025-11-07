import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkinService } from '../services/api';
import { Clock, Plus, Smile, Meh, Frown } from 'lucide-react';
import toast from 'react-hot-toast';

const CheckInsPage = () => {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await checkinService.getAll(patientId);
      setCheckIns(response.data);
    } catch (error) {
      toast.error('Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  };

  const getMoodIcon = (mood) => {
    switch(mood) {
      case 'excellent':
      case 'good':
        return <Smile className="text-green-600" size={24} />;
      case 'fair':
        return <Meh className="text-yellow-600" size={24} />;
      case 'poor':
      case 'very_poor':
        return <Frown className="text-red-600" size={24} />;
      default:
        return <Meh className="text-gray-600" size={24} />;
    }
  };

  const getMoodColor = (mood) => {
    switch(mood) {
      case 'excellent':
      case 'good':
        return 'green';
      case 'fair':
        return 'yellow';
      case 'poor':
      case 'very_poor':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group check-ins by date
  const checkInsByDate = checkIns.reduce((acc, checkin) => {
    const date = checkin.checkin_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(checkin);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Daily Check-ins</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          New Check-in
        </button>
      </div>

      {/* Today's Check-in Prompt */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">How are you feeling today?</h3>
            <p className="text-blue-100">Complete your daily wellness check-in</p>
          </div>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50">
            Start Check-in
          </button>
        </div>
      </div>

      {/* Check-ins Timeline */}
      <div className="space-y-6">
        {Object.keys(checkInsByDate).length > 0 ? (
          Object.keys(checkInsByDate).sort((a, b) => new Date(b) - new Date(a)).map((date) => (
            <div key={date}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="space-y-3">
                {checkInsByDate[date].map((checkin) => {
                  const color = getMoodColor(checkin.mood);
                  return (
                    <div key={checkin.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-${color}-100`}>
                          {getMoodIcon(checkin.mood)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold capitalize">
                                {checkin.type} Check-in
                              </h3>
                              <p className="text-gray-600 text-sm mt-1">
                                <Clock className="inline mr-1" size={16} />
                                {checkin.checkin_time}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm bg-${color}-100 text-${color}-700 capitalize`}>
                              {checkin.mood?.replace('_', ' ')}
                            </span>
                          </div>
                          {checkin.notes && (
                            <p className="text-gray-700 mt-3 p-3 bg-gray-50 rounded-lg">
                              {checkin.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No check-ins recorded</p>
            <p className="text-sm text-gray-500 mt-2">Start tracking your daily wellness</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInsPage;