import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vitalService } from '../services/api';
import { Heart, Plus, TrendingUp, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const VitalsPage = () => {
  const { user } = useAuth();
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await vitalService.getAll(patientId);
      setVitals(response.data);
    } catch (error) {
      toast.error('Failed to load vitals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group vitals by type
  const vitalsByType = vitals.reduce((acc, vital) => {
    if (!acc[vital.type]) {
      acc[vital.type] = [];
    }
    acc[vital.type].push(vital);
    return acc;
  }, {});

  const getVitalIcon = (type) => {
    switch(type) {
      case 'blood_pressure': return Heart;
      case 'glucose': return TrendingUp;
      case 'heart_rate': return Heart;
      case 'weight': return Activity;
      default: return Activity;
    }
  };

  const getVitalColor = (type) => {
    switch(type) {
      case 'blood_pressure': return 'red';
      case 'glucose': return 'blue';
      case 'heart_rate': return 'pink';
      case 'weight': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Health Vitals</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Log Vitals
        </button>
      </div>

      {/* Latest Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(vitalsByType).map((type) => {
          const latestVital = vitalsByType[type][0];
          const Icon = getVitalIcon(type);
          const color = getVitalColor(type);
          
          return (
            <div key={type} className="bg-white rounded-lg shadow p-6">
              <div className={`inline-flex p-3 rounded-lg bg-${color}-100 mb-3`}>
                <Icon className={`text-${color}-600`} size={24} />
              </div>
              <p className="text-sm text-gray-600 capitalize">{type.replace('_', ' ')}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {latestVital.value}
                <span className="text-lg text-gray-600 ml-1">{latestVital.unit}</span>
              </p>
              <p className="text-xs text-green-600 mt-2">Normal</p>
            </div>
          );
        })}
      </div>

      {/* All Readings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">All Readings</h3>
        </div>
        <div className="divide-y">
          {vitals.length > 0 ? (
            vitals.map((vital) => {
              const Icon = getVitalIcon(vital.type);
              const color = getVitalColor(vital.type);
              
              return (
                <div key={vital.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-${color}-100`}>
                        <Icon className={`text-${color}-600`} size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{vital.type.replace('_', ' ')}</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {vital.value} <span className="text-base text-gray-600">{vital.unit}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(vital.recorded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                      Normal
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <Heart className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No vitals recorded</p>
              <p className="text-sm text-gray-500 mt-2">Start tracking your health metrics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VitalsPage;