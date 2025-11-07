import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { emergencyContactService } from '../services/api';
import { Phone, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const EmergencyPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await emergencyContactService.getAll(patientId);
      setContacts(response.data);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Sort contacts - primary first
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Emergency Contacts</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      {/* Emergency Alert */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-center gap-2">
          <Phone className="text-red-600" size={20} />
          <p className="text-red-800 font-medium">
            In case of emergency, call 911 immediately
          </p>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="grid gap-4">
        {sortedContacts.length > 0 ? (
          sortedContacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white rounded-lg shadow p-6 ${
                contact.is_primary ? 'border-2 border-red-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    contact.is_primary ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Phone className={
                      contact.is_primary ? 'text-red-600' : 'text-blue-600'
                    } size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{contact.name}</h3>
                      {contact.is_primary && (
                        <Star className="text-red-500 fill-current" size={16} />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{contact.relationship}</p>
                    <button
                      onClick={() => handleCall(contact.phone)}
                      className="text-xl font-bold text-blue-600 mt-2 hover:text-blue-700"
                    >
                      {contact.phone}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleCall(contact.phone)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    contact.is_primary
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Call Now
                </button>
              </div>
              {contact.is_primary && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-700 font-medium">
                    ⭐ Primary Emergency Contact
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Phone className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No emergency contacts</p>
            <p className="text-sm text-gray-500 mt-2">Add contacts for quick access in emergencies</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleCall('911')}
          className="bg-red-600 text-white p-6 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Phone className="mx-auto mb-2" size={32} />
          <p className="font-bold text-lg">Emergency: 911</p>
        </button>
        <button
          onClick={() => handleCall('211')}
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Phone className="mx-auto mb-2" size={32} />
          <p className="font-bold text-lg">Community Services: 211</p>
        </button>
        <button
          onClick={() => handleCall('988')}
          className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Phone className="mx-auto mb-2" size={32} />
          <p className="font-bold text-lg">Crisis Hotline: 988</p>
        </button>
      </div>
    </div>
  );
};

export default EmergencyPage;