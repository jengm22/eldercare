import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { billingService } from '../services/api';
import { DollarSign, CreditCard, Download, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const BillingPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const patientId = user.patientId || 1;
      const response = await billingService.getInvoices(patientId);
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to load invoices');
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

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  const totalPending = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Billing & Payments</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Outstanding Balance</p>
          <p className="text-3xl font-bold text-red-600">${totalPending.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">{pendingInvoices.length} pending invoices</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Paid This Year</p>
          <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">{paidInvoices.length} paid invoices</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Payment Method</p>
          <div className="flex items-center gap-2 mt-2">
            <CreditCard className="text-gray-600" size={24} />
            <div>
              <p className="font-semibold">•••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/26</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <DollarSign className="text-red-600" size={20} />
            <p className="text-red-800 font-medium">
              You have {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Invoices</h3>
        </div>
        <div className="divide-y">
          {invoices.length > 0 ? (
            invoices.map((invoice) => {
              const color = getStatusColor(invoice.status);
              return (
                <div key={invoice.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-lg bg-${color}-100`}>
                        <DollarSign className={`text-${color}-600`} size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{invoice.description}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-600">
                            Invoice #{invoice.invoice_number}
                          </p>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar size={14} />
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        {invoice.paid_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid on {new Date(invoice.paid_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          ${parseFloat(invoice.amount).toFixed(2)}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 capitalize`}>
                          {invoice.status}
                        </span>
                      </div>
                      {invoice.status === 'pending' && (
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          Pay Now
                        </button>
                      )}
                      {invoice.status === 'paid' && (
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Download size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="mx-auto mb-2 text-gray-400" size={48} />
              <p>No invoices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;