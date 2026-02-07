"use client";

import React, { useState } from "react";
import { Check, X, Printer, FileText } from "lucide-react";
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

// --- Mock Initial Data ---
const INITIAL_BOOKINGS = [
  { id: "B-101", client: "Kamal Perera", barber: "Nuwan Pradeep", status: "Pending", total: "Rs. 2,500" },
  { id: "B-102", client: "Saman Kumara", barber: "Kasun Perera", status: "Confirmed", total: "Rs. 1,800" },
  { id: "B-103", client: "Nimal Siripala", barber: "Lahiru Thirimanne", status: "Pending", total: "Rs. 3,200" },
];

function ManageBookingsContent() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'accept' | 'decline' | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  const { showAlert } = useAlert();

  // --- Handlers ---

  const handleActionClick = (id: string, type: 'accept' | 'decline') => {
    setSelectedBookingId(id);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedBookingId || !modalType) return;

    if (modalType === 'accept') {
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBookingId ? { ...b, status: "Confirmed" } : b))
      );
      showAlert("success", `Booking ${selectedBookingId} confirmed successfully.`);
    } 
    
    else if (modalType === 'decline') {
      setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
      showAlert("error", `Booking ${selectedBookingId} was declined.`);
    }

    // Reset Modal
    setIsModalOpen(false);
    setSelectedBookingId(null);
    setModalType(null);
  };

  const handlePrint = (id: string) => {
    showAlert("success", `Generating invoice for ${id}...`);
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Booking Requests</h1>
          <p className="text-slate-500">Manage incoming appointments and invoices.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-medium">
          Total Requests: <span className="text-[#7C4DFF] font-bold">{bookings.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking ID</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialist</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  No pending booking requests.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs font-medium text-slate-500">{b.id}</td>
                  <td className="p-4 font-bold text-slate-900">{b.client}</td>
                  <td className="p-4 text-sm text-slate-600">{b.barber}</td>
                  <td className="p-4 text-sm font-mono font-medium text-slate-700">{b.total}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                        b.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {b.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleActionClick(b.id, 'accept')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all active:scale-95"
                            title="Accept Booking"
                          >
                            <Check size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleActionClick(b.id, 'decline')}
                            className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all active:scale-95"
                            title="Decline Booking"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handlePrint(b.id)}
                        className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                        title="Print Invoice"
                      >
                        <Printer size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={modalType === 'accept' ? "Confirm Booking?" : "Decline Booking?"}
        description={
          modalType === 'accept' 
            ? "Are you sure you want to confirm this booking? The client will be notified immediately."
            : "Are you sure you want to decline this request? This action cannot be undone."
        }
        confirmText={modalType === 'accept' ? "Yes, Confirm" : "Yes, Decline"}
        isDanger={modalType === 'decline'}
      />
    </div>
  );
}

// Export wrapper with Provider
export default function ManageBookings() {
  return (
    <AlertProvider>
      <ManageBookingsContent />
    </AlertProvider>
  );
}