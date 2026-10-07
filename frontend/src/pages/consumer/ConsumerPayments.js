import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { billService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const ConsumerPayments = () => {
  const { auth } = useAuth();
  const consumer = auth.consumer;
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preselectedBillId = searchParams.get('billId');

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const loadBills = async () => {
    try {
      const list = await billService.getByConsumer(consumer.consumerId);
      const sorted = [...list].sort((a, b) => b.billId - a.billId);
      setBills(sorted);
      // Auto-open payment modal if bill ID is in URL
      if (preselectedBillId) {
        const bill = sorted.find((b) => String(b.billId) === preselectedBillId);
        if (bill && bill.billingStatus !== 'PAID') {
          setSelectedBill(bill);
          setIsPayModalOpen(true);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBills(); }, [consumer.consumerId]); // eslint-disable-line

  const handleOpenPay = (bill) => {
    setSelectedBill(bill);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    setSubmitting(true);
    try {
      await billService.update(selectedBill.billId, { paymentDate });
      toast.success(`Payment of ₹${parseFloat(selectedBill.waterCharge).toFixed(2)} recorded successfully!`);
      setIsPayModalOpen(false);
      setBills((prev) =>
        prev.map((b) =>
          b.billId === selectedBill.billId
            ? { ...b, billingStatus: 'PAID', paymentDate }
            : b
        )
      );
    } catch (err) {
      toast.error(`Payment failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading payment details..." />;

  const unpaidBills = bills.filter((b) => b.billingStatus !== 'PAID');
  const paidBills = bills.filter((b) => b.billingStatus === 'PAID');
  const totalDue = unpaidBills.reduce((s, b) => s + parseFloat(b.waterCharge || 0), 0);
  const totalPaid = paidBills.reduce((s, b) => s + parseFloat(b.waterCharge || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">View outstanding dues and make payments for your water bills.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="consumer-payment-summary">
        <div className="consumer-payment-stat consumer-payment-due">
          <AlertCircle size={20} />
          <div>
            <div className="consumer-payment-stat-value">₹{totalDue.toFixed(2)}</div>
            <div className="consumer-payment-stat-label">Total Outstanding</div>
          </div>
        </div>
        <div className="consumer-payment-stat consumer-payment-paid">
          <CheckCircle size={20} />
          <div>
            <div className="consumer-payment-stat-value">₹{totalPaid.toFixed(2)}</div>
            <div className="consumer-payment-stat-label">Total Paid</div>
          </div>
        </div>
      </div>

      {/* Unpaid Bills */}
      {unpaidBills.length > 0 && (
        <div className="panel-card" style={{ marginBottom: '20px' }}>
          <div className="panel-header">
            <h3 className="panel-title" style={{ color: 'var(--warning)' }}>
              <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Outstanding Bills
            </h3>
            <span className="nav-badge" style={{ background: 'var(--warning)', color: '#fff' }}>
              {unpaidBills.length}
            </span>
          </div>
          <div className="consumer-unpaid-list">
            {unpaidBills.map((b) => (
              <div key={b.billId} className="consumer-unpaid-item">
                <div className="consumer-unpaid-info">
                  <div className="consumer-unpaid-bill-id">Bill #{b.billId}</div>
                  <div className="consumer-unpaid-meta">
                    Date: {b.billDate || 'N/A'} · {b.consumption} kL
                  </div>
                </div>
                <div className="consumer-unpaid-amount">₹{parseFloat(b.waterCharge).toFixed(2)}</div>
                <button
                  className="consumer-pay-btn"
                  onClick={() => handleOpenPay(b)}
                >
                  <CreditCard size={15} />
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="panel-card">
        <div className="panel-header">
          <h3 className="panel-title">Payment History</h3>
          <span className="text-muted text-sm">{paidBills.length} payments</span>
        </div>
        {paidBills.length === 0 ? (
          <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
            No payments recorded yet.
          </div>
        ) : (
          <div className="table-card" style={{ marginTop: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Bill Date</th>
                  <th>Payment Date</th>
                  <th>Units</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {paidBills.map((b) => (
                  <tr key={b.billId}>
                    <td className="font-mono text-muted">#{b.billId}</td>
                    <td>{b.billDate || 'N/A'}</td>
                    <td className="text-green-600">{b.paymentDate || '—'}</td>
                    <td>{b.consumption} kL</td>
                    <td className="font-semibold" style={{ color: 'var(--success)' }}>
                      ₹{parseFloat(b.waterCharge).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Payment"
        subtitle={selectedBill ? `Bill #${selectedBill.billId} — ₹${parseFloat(selectedBill?.waterCharge || 0).toFixed(2)}` : ''}
      >
        <form onSubmit={handleConfirmPayment} className="modal-form">
          <div className="consumer-payment-modal-amount">
            <span>Amount to Pay</span>
            <span className="consumer-payment-modal-value">
              ₹{parseFloat(selectedBill?.waterCharge || 0).toFixed(2)}
            </span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="payment-date">Payment Date</label>
            <input
              id="payment-date"
              type="date"
              required
              className="form-input"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ConsumerPayments;
