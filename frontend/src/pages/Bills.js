import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Trash2,
  Droplets,
  User,
  MapPin,
  Building,
  Plus,
  Edit,
} from 'lucide-react';
import { billService, consumerService, readingService } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const Bills = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [readings, setReadings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [selectedBill, setSelectedBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Add / Edit form fields
  const [formData, setFormData] = useState({
    consumerId: '',
    readingId: '',
    consumption: '',
    waterCharge: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    billingStatus: 'UNPAID',
    paymentDate: '',
  });

  useEffect(() => {
    loadBills();
    loadDropdownData();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await billService.getCompleteDetails().catch(() => billService.getAll());
      const sorted = [...data].sort((a, b) => b.billId - a.billId);
      setBills(sorted);
    } catch (err) {
      toast.error('Failed to load water bills');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [cData, rData] = await Promise.all([
        consumerService.getAll().catch(() => []),
        readingService.getAll().catch(() => []),
      ]);
      setConsumers(cData);
      setReadings(rData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      consumerId: consumers[0]?.consumerId || '',
      readingId: readings[0]?.readingId || '',
      consumption: '25.50',
      waterCharge: '125.00',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      billingStatus: 'UNPAID',
      paymentDate: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (bill) => {
    setSelectedBill(bill);
    setFormData({
      consumerId: bill.consumer?.consumerId || bill.consumerId || '',
      readingId: bill.reading?.readingId || '',
      consumption: bill.consumption || '',
      waterCharge: bill.waterCharge || '',
      billDate: bill.billDate || new Date().toISOString().split('T')[0],
      dueDate: bill.dueDate || getDueDate(bill.billDate),
      billingStatus: bill.billingStatus || 'UNPAID',
      paymentDate: bill.paymentDate || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenInvoice = (bill) => {
    setSelectedBill(bill);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenDelete = (bill) => {
    setSelectedBill(bill);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        consumer: { consumerId: Number(formData.consumerId) },
        reading: formData.readingId ? { readingId: Number(formData.readingId) } : null,
        consumption: Number(formData.consumption),
        waterCharge: Number(formData.waterCharge),
        billDate: formData.billDate,
        billingStatus: formData.billingStatus,
        paymentDate: formData.billingStatus === 'PAID' ? (formData.paymentDate || formData.billDate) : null,
      };
      await billService.create(payload);
      toast.success('Water bill generated successfully!');
      setIsAddModalOpen(false);
      loadBills();
    } catch (err) {
      toast.error(`Failed to create bill: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    setSubmitting(true);
    try {
      const payload = {
        consumption: Number(formData.consumption),
        waterCharge: Number(formData.waterCharge),
        billDate: formData.billDate,
        billingStatus: formData.billingStatus,
        paymentDate: formData.billingStatus === 'PAID' ? (formData.paymentDate || new Date().toISOString().split('T')[0]) : null,
      };
      await billService.update(selectedBill.billId, payload);
      toast.success(`Bill #${selectedBill.billId} updated successfully!`);
      setIsEditModalOpen(false);
      loadBills();
    } catch (err) {
      toast.error(`Failed to update bill: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBill) return;
    setSubmitting(true);
    try {
      await billService.delete(selectedBill.billId);
      toast.success(`Bill #${selectedBill.billId} deleted successfully.`);
      setIsDeleteModalOpen(false);
      loadBills();
    } catch (err) {
      toast.error(`Unable to delete bill: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getDueDate = (billDateStr) => {
    if (!billDateStr) return 'N/A';
    try {
      const d = new Date(billDateStr);
      d.setDate(d.getDate() + 15);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return billDateStr;
    }
  };

  const filteredBills = bills.filter((b) => {
    if (statusFilter === 'PAID' && b.billingStatus !== 'PAID') return false;
    if (statusFilter === 'UNPAID' && b.billingStatus === 'PAID') return false;

    const q = searchQuery.toLowerCase();
    const consumerName = b.consumer?.name?.toLowerCase() || '';
    const address = b.consumer?.address?.toLowerCase() || '';
    const billId = b.billId?.toString() || '';
    const connectionId = (b.reading?.connection?.connectionId || '').toString();

    return consumerName.includes(q) || address.includes(q) || billId.includes(q) || connectionId.includes(q);
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Water Bills Management</h1>
          <p className="page-subtitle">
            Generate, manage, edit, and review water utility billing invoices.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>All Bills ({bills.length})</span>
          </button>
          <button
            className={`filter-tab tab-highlight ${statusFilter === 'UNPAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNPAID')}
          >
            <Clock size={15} className="text-amber" />
            <span>
              Unpaid ({bills.filter((b) => b.billingStatus !== 'PAID').length})
            </span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'PAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PAID')}
          >
            <CheckCircle2 size={15} className="text-emerald" />
            <span>
              Paid ({bills.filter((b) => b.billingStatus === 'PAID').length})
            </span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Bill #, Consumer, Connection ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bills Table */}
      {loading ? (
        <LoadingSpinner message="Loading bills..." />
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills found"
          description={
            searchQuery
              ? `No invoices match "${searchQuery}"`
              : statusFilter === 'UNPAID'
              ? 'Great! There are no unpaid water bills.'
              : 'Click "Create New Bill" to generate an invoice.'
          }
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Bill ID</th>
                <th>Consumer</th>
                <th>Connection ID</th>
                <th>Reading / Units Consumed</th>
                <th>Bill Amount</th>
                <th>Bill Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((b) => {
                const isPaid = b.billingStatus === 'PAID';
                const connId = b.reading?.connection?.connectionId || b.consumer?.consumerId || '—';
                const dueDateStr = getDueDate(b.billDate);

                return (
                  <tr key={b.billId}>
                    <td className="font-mono text-cyan font-semibold">#{b.billId}</td>
                    <td>
                      <div>
                        <div className="font-semibold">
                          {b.consumer?.name || `Consumer #${b.consumer?.consumerId || b.consumerId}`}
                        </div>
                        <span className="text-xs text-muted">
                          Consumer #{b.consumer?.consumerId || b.consumerId}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">Conn #{connId}</span>
                    </td>
                    <td>
                      <span className="font-mono font-medium">{b.consumption} kL</span>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-cyan">
                        ${parseFloat(b.waterCharge || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-sm">{b.billDate}</td>
                    <td className="text-sm text-muted">{dueDateStr}</td>
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
                          title="View Invoice Details"
                          onClick={() => handleOpenInvoice(b)}
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          className="action-btn text-indigo"
                          title="Edit Bill"
                          onClick={() => handleOpenEdit(b)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn text-rose"
                          title="Delete Bill"
                          onClick={() => handleOpenDelete(b)}
                        >
                          <Trash2 size={16} />
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

      {/* Add New Bill Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Water Bill"
        subtitle="Generate a new billing invoice for a consumer"
        maxWidth="520px"
      >
        <form onSubmit={handleAddSubmit} className="form-layout">
          <div className="form-group">
            <label className="form-label">Select Consumer *</label>
            <select
              className="form-select"
              value={formData.consumerId}
              onChange={(e) => setFormData({ ...formData, consumerId: e.target.value })}
              required
            >
              <option value="">-- Choose Consumer --</option>
              {consumers.map((c) => (
                <option key={c.consumerId} value={c.consumerId}>
                  {c.name} (ID: #{c.consumerId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Meter Reading / Connection (Optional)</label>
            <select
              className="form-select"
              value={formData.readingId}
              onChange={(e) => setFormData({ ...formData, readingId: e.target.value })}
            >
              <option value="">-- Select Meter Reading --</option>
              {readings.map((r) => (
                <option key={r.readingId} value={r.readingId}>
                  Reading #{r.readingId} - Conn #{r.connection?.connectionId || r.connectionId} ({r.unitsConsumed} kL)
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Units Consumed (kL) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.consumption}
                onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bill Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.waterCharge}
                onChange={(e) => setFormData({ ...formData, waterCharge: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Bill Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Billing Status</label>
            <select
              className="form-select"
              value={formData.billingStatus}
              onChange={(e) => setFormData({ ...formData, billingStatus: e.target.value })}
            >
              <option value="UNPAID">Unpaid / Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Generating...' : 'Generate Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Bill Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Water Bill"
        subtitle={`Bill #${selectedBill?.billId} for ${selectedBill?.consumer?.name}`}
        maxWidth="520px"
      >
        <form onSubmit={handleEditSubmit} className="form-layout">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Units Consumed (kL)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.consumption}
                onChange={(e) => setFormData({ ...formData, consumption: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bill Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.waterCharge}
                onChange={(e) => setFormData({ ...formData, waterCharge: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Bill Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing Status</label>
            <select
              className="form-select"
              value={formData.billingStatus}
              onChange={(e) => setFormData({ ...formData, billingStatus: e.target.value })}
            >
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {formData.billingStatus === 'PAID' && (
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Water Supply Utility Statement"
        subtitle="Official Billing Invoice"
        maxWidth="720px"
      >
        {selectedBill && (
          <div className="invoice-container">
            <div className="invoice-header">
              <div className="invoice-brand">
                <div className="invoice-logo">
                  <Droplets size={24} />
                </div>
                <div>
                  <h2>MUNICIPAL WATER UTILITY BOARD</h2>
                  <p>Department of Water Resources</p>
                </div>
              </div>
              <div className="invoice-meta">
                <div className="invoice-number">INVOICE #{selectedBill.billId}</div>
                <div className="invoice-date">Date: {selectedBill.billDate}</div>
                <div className={`invoice-stamp ${selectedBill.billingStatus === 'PAID' ? 'stamp-paid' : 'stamp-due'}`}>
                  {selectedBill.billingStatus === 'PAID' ? 'PAID' : 'UNPAID'}
                </div>
              </div>
            </div>

            <div className="invoice-divider"></div>

            <div className="invoice-parties">
              <div className="party-box">
                <div className="party-title">CONSUMER DETAILS</div>
                <div className="party-name">{selectedBill.consumer?.name}</div>
                <div className="party-detail">
                  <User size={13} /> Consumer ID: #{selectedBill.consumer?.consumerId}
                </div>
                <div className="party-detail">
                  <MapPin size={13} /> {selectedBill.consumer?.address}
                </div>
              </div>

              <div className="party-box">
                <div className="party-title">CONNECTION DETAILS</div>
                <div className="party-detail">
                  <Building size={13} /> Connection ID: #{selectedBill.reading?.connection?.connectionId || selectedBill.consumer?.consumerId || 'N/A'}
                </div>
                <div className="party-detail">
                  Due Date: <strong>{getDueDate(selectedBill.billDate)}</strong>
                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Units Consumed</th>
                  <th style={{ textAlign: 'right' }}>Bill Amount ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Water Usage Assessment</strong>
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-mono font-bold">
                    {selectedBill.consumption} kL
                  </td>
                  <td style={{ textAlign: 'right' }} className="font-mono font-bold text-cyan">
                    ${parseFloat(selectedBill.waterCharge || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => window.print()}>
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
              <button type="button" className="btn-primary" onClick={() => setIsInvoiceModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Bill Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Bill"
        subtitle={`Bill #${selectedBill?.billId}`}
      >
        <div className="delete-confirm-box">
          <p>
            Are you sure you want to remove bill record{' '}
            <strong>#{selectedBill?.billId}</strong> for consumer{' '}
            <strong>"{selectedBill?.consumer?.name}"</strong>?
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={submitting}
              onClick={handleDeleteConfirm}
            >
              {submitting ? 'Deleting...' : 'Delete Bill'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bills;
