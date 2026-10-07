import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { billService } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const Payments = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'UNPAID'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Selected item
  const [selectedItem, setSelectedItem] = useState(null);
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState('PAID');
  const [paymentMethod, setPaymentMethod] = useState('Online Gateway');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await billService.getCompleteDetails().catch(() => billService.getAll());
      const sorted = [...data].sort((a, b) => b.billId - a.billId);
      setBills(sorted);
    } catch (err) {
      toast.error('Failed to load payment records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (bill) => {
    setSelectedItem(bill);
    setIsDetailModalOpen(true);
  };

  const handleOpenUpdate = (bill) => {
    setSelectedItem(bill);
    setNewPaymentDate(bill.paymentDate || new Date().toISOString().split('T')[0]);
    setNewStatus(bill.billingStatus || 'PAID');
    setPaymentMethod('Online Gateway');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const isPaid = newStatus === 'PAID';
      await billService.update(selectedItem.billId, {
        billingStatus: newStatus,
        paymentDate: isPaid ? newPaymentDate : null,
      });
      toast.success(`Payment status for Bill #${selectedItem.billId} updated to ${newStatus}`);
      setIsUpdateModalOpen(false);
      loadPayments();
    } catch (err) {
      toast.error(`Failed to update payment status: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Payment transactions
  const payments = bills.map((b) => {
    const isPaid = b.billingStatus === 'PAID';
    return {
      paymentId: `PAY-${1000 + b.billId}`,
      billId: b.billId,
      consumerName: b.consumer?.name || `Consumer #${b.consumer?.consumerId || b.consumerId}`,
      consumerId: b.consumer?.consumerId || b.consumerId,
      amount: b.waterCharge || 0,
      paymentDate: b.paymentDate || (isPaid ? '2026-03-01' : null),
      paymentMethod: isPaid ? 'Online Gateway (Card/UPI)' : 'N/A',
      status: isPaid ? 'Paid' : 'Unpaid',
      rawBill: b,
    };
  });

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === 'PAID' && p.status !== 'Paid') return false;
    if (statusFilter === 'UNPAID' && p.status === 'Paid') return false;

    const q = searchQuery.toLowerCase();
    return (
      p.paymentId.toLowerCase().includes(q) ||
      p.billId.toString().includes(q) ||
      p.consumerName.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q)
    );
  });

  // KPI Statistics
  const totalCollected = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingAmount = payments
    .filter((p) => p.status !== 'Paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const paidCount = payments.filter((p) => p.status === 'Paid').length;
  const pendingCount = payments.filter((p) => p.status !== 'Paid').length;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Tracking & History</h1>
          <p className="page-subtitle">
            Monitor real-time payment transactions, view settlement receipts, and update payment statuses.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Revenue Collected</span>
            <div className="stat-icon-wrapper text-emerald bg-emerald-light">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value text-emerald">${totalCollected.toFixed(2)}</div>
          <div className="stat-footer text-muted">From {paidCount} completed transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending Payments</span>
            <div className="stat-icon-wrapper text-amber bg-amber-light">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value text-amber">${pendingAmount.toFixed(2)}</div>
          <div className="stat-footer text-muted">{pendingCount} uncollected bill balances</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Completed Settlements</span>
            <div className="stat-icon-wrapper text-cyan bg-cyan-light">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="stat-value">{paidCount}</div>
          <div className="stat-footer text-muted">Out of {payments.length} total bills</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Collection Rate</span>
            <div className="stat-icon-wrapper text-indigo bg-indigo-light">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">
            {payments.length ? Math.round((paidCount / payments.length) * 100) : 0}%
          </div>
          <div className="stat-footer text-muted">Settlement efficiency index</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>All Payments ({payments.length})</span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'PAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PAID')}
          >
            <CheckCircle2 size={15} className="text-emerald" />
            <span>Paid / Settled ({paidCount})</span>
          </button>
          <button
            className={`filter-tab tab-highlight ${statusFilter === 'UNPAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNPAID')}
          >
            <Clock size={15} className="text-amber" />
            <span>Unpaid / Pending ({pendingCount})</span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Payment ID, Bill ID, Consumer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <LoadingSpinner message="Loading payment transactions..." />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment records found"
          description={
            searchQuery
              ? `No transactions match "${searchQuery}"`
              : 'There are no payment records registered in the system.'
          }
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Payment ID</th>
                <th style={{ width: '90px' }}>Bill ID</th>
                <th>Consumer Name</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const isPaid = p.status === 'Paid';
                return (
                  <tr key={p.paymentId}>
                    <td className="font-mono text-cyan font-semibold">{p.paymentId}</td>
                    <td className="font-mono text-muted">#{p.billId}</td>
                    <td>
                      <div>
                        <div className="font-semibold">{p.consumerName}</div>
                        <span className="text-xs text-muted">Consumer #{p.consumerId}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-emerald">${Number(p.amount).toFixed(2)}</td>
                    <td>
                      {p.paymentDate ? (
                        <div className="table-meta-item">
                          <Calendar size={13} className="text-muted" />
                          <span>{p.paymentDate}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">Pending</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.paymentMethod}</span>
                    </td>
                    <td>
                      {isPaid ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={12} /> Unpaid
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn text-cyan"
                          title="View Payment Details"
                          onClick={() => handleOpenDetail(p)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-btn text-indigo"
                          title="Update Payment Status"
                          onClick={() => handleOpenUpdate(p.rawBill)}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Payment Transaction Receipt"
        subtitle={`Transaction Ref: ${selectedItem?.paymentId}`}
        maxWidth="540px"
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: selectedItem.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: selectedItem.status === 'Paid' ? '#10b981' : '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                {selectedItem.status === 'Paid' ? <CheckCircle2 size={30} /> : <Clock size={30} />}
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                ${Number(selectedItem.amount).toFixed(2)}
              </h3>
              <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Payment Status: <strong style={{ color: selectedItem.status === 'Paid' ? '#10b981' : '#f59e0b' }}>{selectedItem.status}</strong>
              </p>
            </div>

            <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="info-box">
                <span className="info-label">Payment Ref ID</span>
                <span className="info-value font-mono">{selectedItem.paymentId}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Associated Bill ID</span>
                <span className="info-value font-mono">#{selectedItem.billId}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Consumer Name</span>
                <span className="info-value">{selectedItem.consumerName}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Consumer ID</span>
                <span className="info-value">Consumer #{selectedItem.consumerId}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Payment Date</span>
                <span className="info-value">{selectedItem.paymentDate || 'Not Paid Yet'}</span>
              </div>
              <div className="info-box">
                <span className="info-label">Payment Channel</span>
                <span className="info-value">{selectedItem.paymentMethod}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Payment Status Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Payment Status"
        subtitle={`Bill #${selectedItem?.billId}`}
        maxWidth="480px"
      >
        <form onSubmit={handleUpdateSubmit} className="form-layout">
          <div className="form-group">
            <label className="form-label">Consumer</label>
            <input
              type="text"
              className="form-input"
              value={selectedItem?.consumer?.name || `Consumer #${selectedItem?.consumerId}`}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount</label>
            <input
              type="text"
              className="form-input"
              value={`$${Number(selectedItem?.waterCharge || 0).toFixed(2)}`}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Status</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="PAID">Paid / Completed</option>
              <option value="UNPAID">Unpaid / Pending</option>
            </select>
          </div>

          {newStatus === 'PAID' && (
            <>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Online Gateway">Online Gateway (Card / NetBanking)</option>
                  <option value="Counter Cash">Counter Cash Payment</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                  <option value="UPI Payment">UPI / Digital Wallet</option>
                </select>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsUpdateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Payment Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
