import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/api';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await documentService.getAll(patientId);
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (type) => {
    return <FileText size={24} />;
  };

  const getDocumentColor = (type) => {
    const colors = {
      'insurance': 'blue',
      'medical_record': 'green',
      'legal': 'purple',
      'prescription': 'pink',
      'lab_result': 'yellow',
    };
    return colors[type] || 'gray';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Upload size={20} />
          Upload Document
        </button>
      </div>

      {/* Storage Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-900">Storage Usage</p>
            <p className="text-sm text-blue-700">
              {documents.length} documents • Secure cloud storage
            </p>
          </div>
          <FileText className="text-blue-600" size={32} />
        </div>
      </div>

      {/* Documents by Type */}
      {Object.keys(documentsByType).length > 0 ? (
        Object.keys(documentsByType).map((type) => {
          const docs = documentsByType[type];
          const color = getDocumentColor(type);
          
          return (
            <div key={type} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 capitalize">
                {type.replace('_', ' ')} ({docs.length})
              </h3>
              <div className="grid gap-3">
                {docs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-lg bg-${color}-100`}>
                          <FileText className={`text-${color}-600`} size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{doc.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {doc.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(doc.created_at).toLocaleDateString()} • {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Download size={20} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No documents uploaded</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload medical records, insurance cards, and important documents
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;