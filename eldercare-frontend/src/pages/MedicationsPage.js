import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { medicationService } from '../services/api';
import { Pill, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const MedicationsPage = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await medicationService.getAll(patientId);
      setMedications(response.data);
    } catch (error) {
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (medId) => {
    try {
      await medicationService.logTaken(medId, { takenAt: new Date().toISOString() });
      toast.success('Medication marked as taken');
      fetchMedications();
    } catch (error) {
      toast.error('Failed to update medication');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Medications</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Add Medication
        </button>
      </div>

      <div className="grid gap-4">
        {medications.length > 0 ? (
          medications.map((med) => (
            <div key={med.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Pill className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{med.name}</h3>
                    <p className="text-gray-600">{med.dosage} - {med.frequency}</p>
                    <p className="text-sm text-gray-500 mt-1">Times: {med.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkTaken(med.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark Taken
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Pill className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No medications found</p>
            <p className="text-sm text-gray-500 mt-2">Add your first medication to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationsPage;