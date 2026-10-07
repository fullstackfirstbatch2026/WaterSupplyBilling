import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Gauge,
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  Receipt,
  Calculator,
} from 'lucide-react';
import {
  readingService,
  connectionService,
  billService,
  waterBillingService,
} from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const Readings = () => {
  const [searchParams] = useSearchParams();
  const preselectedConnId = searchParams.get('newConnId');
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState([]);
  const [connections, setConnections] = useState([]);
  const [billedReadingIds, setBilledReadingIds] = useState(new Set());

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNBILLED' | 'BILLED'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState(null);

  // Generating bill state
  const [generatingReadingId, setGeneratingReadingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    connectionId: '',
    previousReading: '',
    currentReading: '',
    readingDate: new Date().toISOString().split('T')[0],
  });
  const [previewUnits, setPreviewUnits] = useState(0);
  const [previewCharge, setPreviewCharge] = useState(null);
  const [calculatingPreview, setCalculatingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselectedConnId && connections.length > 0) {
      handleOpenAdd(preselectedConnId);
    }
  }, [preselectedConnId, connections]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [readingsList, connectionsList, billsList] = await Promise.all([
        readingService.getAll(),
        connectionService.getAll(),
        billService.getAll().catch(() => []),
      ]);

      // Set of reading IDs that already have a bill
      const billedSet = new Set();
      billsList.forEach((b) => {
        if (b.reading?.readingId) {
          billedSet.add(b.reading.readingId);
        }
      });

      setReadings(readingsList);
      setConnections(connectionsList);
      setBilledReadingIds(billedSet);
    } catch (err) {
      toast.error('Failed to load meter readings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (defaultConnId = null) => {
    const connId = defaultConnId || (connections.length > 0 ? connections[0].connectionId : '');
    const latestForConn = findLatestReadingForConnection(connId);
    const prev = latestForConn ? latestForConn.currentReading : '0';

    setFormData({
      connectionId: connId,
      previousReading: prev,
      currentReading: '',
      readingDate: new Date().toISOString().split('T')[0],
    });
    setPreviewUnits(0);
    setPreviewCharge(null);
    setIsAddModalOpen(true);
  };

  const findLatestReadingForConnection = (connId) => {
    if (!connId) return null;
    const connReadings = readings.filter(
      (r) => r.connection?.connectionId === parseInt(connId, 10)
    );
    if (connReadings.length === 0) return null;
    // Sort descending by id
    return [...connReadings].sort((a, b) => b.readingId - a.readingId)[0];
  };

  const handleConnectionChange = (connId) => {
    const latestForConn = findLatestReadingForConnection(connId);
    const prev = latestForConn ? latestForConn.currentReading : '0';
    setFormData((prevData) => ({
      ...prevData,
      connectionId: connId,
      previousReading: prev,
      currentReading: '',
    }));
    setPreviewUnits(0);
    setPreviewCharge(null);
  };

  const handleCurrentReadingChange = async (currentVal) => {
    setFormData((prev) => ({ ...prev, currentReading: currentVal }));
    const prevNum = parseFloat(formData.previousReading) || 0;
    const currNum = parseFloat(currentVal);

    if (!isNaN(currNum) && currNum >= prevNum) {
      const units = currNum - prevNum;
      setPreviewUnits(units);
      setCalculatingPreview(true);
      try {
        const charge = await waterBillingService.calculateCharge(Math.round(units));
        setPreviewCharge(charge);
      } catch (err) {
        setPreviewCharge(null);
      } finally {
        setCalculatingPreview(false);
      }
    } else {
      setPreviewUnits(0);
      setPreviewCharge(null);
    }
  };

  const handleCreateReading = async (e) => {
    e.preventDefault();
    const prev = parseFloat(formData.previousReading);
    const curr = parseFloat(formData.currentReading);

    if (isNaN(curr) || curr < prev) {
      toast.error('Current reading must be greater than or equal to previous reading');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        previousReading: prev,
        currentReading: curr,
        readingDate: formData.readingDate,
        connection: {
          connectionId: parseInt(formData.connectionId, 10),
        },
      };

      const newReading = await readingService.create(payload);
      toast.success(`Meter Reading #${newReading.readingId} recorded successfully!`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(`Failed to record reading: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Natural Procedure Execution: generate_water_bill(readingId)
  const handleGenerateBill = async (readingId) => {
    setGeneratingReadingId(readingId);
    try {
      const resultMessage = await waterBillingService.generateBill(readingId);
      toast.success(resultMessage || 'Water bill generated successfully!');
      await loadData();
    } catch (err) {
      toast.error(`Error generating bill: ${err.message}`);
    } finally {
      setGeneratingReadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReading) return;
    setSubmitting(true);
    try {
      await readingService.delete(selectedReading.readingId);
      toast.success(`Reading #${selectedReading.readingId} deleted successfully.`);
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Cannot delete reading: A generated bill references this reading record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered readings list
  const filteredReadings = readings.filter((r) => {
    const isBilled = billedReadingIds.has(r.readingId);
    if (statusFilter === 'UNBILLED' && isBilled) return false;
    if (statusFilter === 'BILLED' && !isBilled) return false;

    const q = searchQuery.toLowerCase();
    const consumerName = r.connection?.consumer?.name?.toLowerCase() || '';
    const connId = r.connection?.connectionId?.toString() || '';
    const readingId = r.readingId?.toString() || '';

    return (
      consumerName.includes(q) ||
      connId.includes(q) ||
      readingId.includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Meter Readings & Tariff Assessment</h1>
          <p className="page-subtitle">
            Log consumption units, preview database tariff charges, and execute automated billing.
          </p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenAdd()}>
          <Plus size={17} />
          <span>Record Reading</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>All Readings ({readings.length})</span>
          </button>
          <button
            className={`filter-tab tab-highlight ${statusFilter === 'UNBILLED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNBILLED')}
          >
            <Clock size={15} className="text-amber" />
            <span>
              Unbilled (
              {readings.filter((r) => !billedReadingIds.has(r.readingId)).length}
              )
            </span>
          </button>
          <button
            className={`filter-tab ${statusFilter === 'BILLED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('BILLED')}
          >
            <CheckCircle2 size={15} className="text-emerald" />
            <span>
              Billed ({readings.filter((r) => billedReadingIds.has(r.readingId)).length})
            </span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by reading ID, connection, consumer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Fetching meter recordings..." />
      ) : filteredReadings.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No readings found"
          description={
            searchQuery
              ? `No meter readings match "${searchQuery}"`
              : statusFilter === 'UNBILLED'
              ? 'All current meter readings have been billed.'
              : 'Record meter consumption readings to initiate billing.'
          }
          actionLabel={statusFilter === 'ALL' && !searchQuery ? 'Record Meter Reading' : null}
          onAction={() => handleOpenAdd()}
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Read ID</th>
                <th>Grid Connection & Consumer</th>
                <th>Previous Reading</th>
                <th>Current Reading</th>
                <th>Consumption Units</th>
                <th>Date Taken</th>
                <th>Billing Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReadings.map((r) => {
                const isBilled = billedReadingIds.has(r.readingId);
                const consumption = (
                  parseFloat(r.currentReading) - parseFloat(r.previousReading)
                ).toFixed(2);
                const isGenerating = generatingReadingId === r.readingId;

                return (
                  <tr key={r.readingId}>
                    <td className="font-mono text-muted">#{r.readingId}</td>
                    <td>
                      <div>
                        <div className="font-semibold">
                          Connection #{r.connection?.connectionId} (
                          {r.connection?.connectionType || 'Domestic'})
                        </div>
                        <span className="text-xs text-muted">
                          Consumer: {r.connection?.consumer?.name || 'Assigned User'}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono">{parseFloat(r.previousReading).toFixed(2)}</td>
                    <td className="font-mono font-medium">
                      {parseFloat(r.currentReading).toFixed(2)}
                    </td>
                    <td>
                      <span className="units-badge font-mono font-bold">
                        {consumption} kL
                      </span>
                    </td>
                    <td className="text-sm">{r.readingDate}</td>
                    <td>
                      {isBilled ? (
                        <span className="status-chip chip-paid">
                          <CheckCircle2 size={12} /> Billed (1:1)
                        </span>
                      ) : (
                        <span className="status-chip chip-unpaid">
                          <Clock size={12} /> Unbilled
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell">
                        {!isBilled ? (
                          <button
                            className="btn-action-procedure"
                            title="Generate water bill"
                            disabled={isGenerating}
                            onClick={() => handleGenerateBill(r.readingId)}
                          >
                            <Zap size={14} />
                            <span>{isGenerating ? 'Generating...' : 'Generate Bill'}</span>
                          </button>
                        ) : (
                          <button
                            className="btn-action-primary"
                            title="View Generated Invoice"
                            onClick={() => navigate('/admin/bills')}
                          >
                            <Receipt size={14} />
                            <span>View Bill</span>
                          </button>
                        )}
                        <button
                          className="btn-action btn-delete"
                          title="Delete Reading"
                          onClick={() => {
                            setSelectedReading(r);
                            setIsDeleteModalOpen(true);
                          }}
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

      {/* Record Meter Reading Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record New Meter Reading"
        subtitle="Log water consumption meter metrics and preview automated tariff"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateReading} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="read-conn">
              Select Water Connection *
            </label>
            <select
              id="read-conn"
              required
              className="form-select"
              value={formData.connectionId}
              onChange={(e) => handleConnectionChange(e.target.value)}
            >
              <option value="">-- Choose Connection --</option>
              {connections.map((conn) => (
                <option key={conn.connectionId} value={conn.connectionId}>
                  Conn #{conn.connectionId} — {conn.consumer?.name || 'Consumer'} (
                  {conn.connectionType})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="read-prev">
                Previous Reading (kL)
              </label>
              <input
                id="read-prev"
                type="number"
                step="0.01"
                required
                className="form-input font-mono"
                value={formData.previousReading}
                onChange={(e) => {
                  setFormData({ ...formData, previousReading: e.target.value });
                  handleCurrentReadingChange(formData.currentReading);
                }}
              />
              <span className="form-hint">Auto-fetched from last reading</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="read-curr">
                Current Reading (kL) *
              </label>
              <input
                id="read-curr"
                type="number"
                step="0.01"
                required
                className="form-input font-mono font-bold"
                placeholder="e.g. 155.00"
                value={formData.currentReading}
                onChange={(e) => handleCurrentReadingChange(e.target.value)}
              />
              <span className="form-hint">Must be ≥ previous reading</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="read-date">
              Meter Reading Date *
            </label>
            <input
              id="read-date"
              type="date"
              required
              className="form-input"
              value={formData.readingDate}
              onChange={(e) => setFormData({ ...formData, readingDate: e.target.value })}
            />
          </div>

          {/* Tariff Estimation Card */}
          <div className="db-tariff-preview-card">
            <div className="preview-top">
              <div className="flex-row items-center gap-1">
                <Calculator size={14} className="text-cyan" />
                <span className="preview-badge">Estimated Charge</span>
              </div>
              {calculatingPreview && <span className="text-xs text-muted">Calculating...</span>}
            </div>
            <div className="preview-body">
              <div className="preview-stat">
                <span className="text-xs text-muted">Units Consumed</span>
                <span className="preview-stat-val font-mono">{previewUnits.toFixed(2)} kL</span>
              </div>
              <div className="preview-stat">
                <span className="text-xs text-muted">Estimated Tariff Charge</span>
                <span className="preview-stat-val font-mono text-cyan font-bold">
                  {previewCharge !== null ? `₹${previewCharge.toFixed(2)}` : '₹0.00'}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted" style={{ marginTop: '8px' }}>
              * Calculated dynamically according to municipal tiered slab rates.
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Meter Reading'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Reading Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Reading"
        subtitle={`Reading #${selectedReading?.readingId}`}
      >
        <div className="delete-confirm-box">
          <p>
            Are you sure you want to delete meter reading{' '}
            <strong>#{selectedReading?.readingId}</strong>?
          </p>
          <p className="delete-warning">
            Note: If a bill has already been generated from this reading, deletion will be rejected.
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
              {submitting ? 'Deleting...' : 'Delete Reading'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Readings;
