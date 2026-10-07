import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Plus,
  Search,
  Building,
  Home,
  Trash2,
  Gauge,
  Calendar,
  User,
} from 'lucide-react';
import { connectionService, consumerService } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const Connections = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    consumerId: '',
    connectionType: 'Domestic',
    connectionDate: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connList, consumerList] = await Promise.all([
        connectionService.getAll(),
        consumerService.getAll(),
      ]);
      setConnections(connList);
      setConsumers(consumerList);
    } catch (err) {
      toast.error('Failed to load water connections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      consumerId: consumers.length > 0 ? consumers[0].consumerId : '',
      connectionType: 'Domestic',
      connectionDate: new Date().toISOString().split('T')[0],
    });
    setIsAddModalOpen(true);
  };

  const handleCreateConnection = async (e) => {
    e.preventDefault();
    if (!formData.consumerId) {
      toast.error('Please select a consumer for this connection');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        connectionType: formData.connectionType,
        connectionDate: formData.connectionDate,
        consumer: {
          consumerId: parseInt(formData.consumerId, 10),
        },
      };
      await connectionService.create(payload);
      toast.success('New water connection provisioned successfully!');
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(`Failed to create connection: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConnection) return;
    setSubmitting(true);
    try {
      await connectionService.delete(selectedConnection.connectionId);
      toast.success(`Connection #${selectedConnection.connectionId} removed.`);
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(
        'Unable to delete connection: Associated meter readings exist. Delete them first.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConnections = connections.filter((conn) => {
    const matchesType =
      typeFilter === 'ALL' ||
      (conn.connectionType || '').toUpperCase() === typeFilter.toUpperCase();

    const q = searchQuery.toLowerCase();
    const consumerName = conn.consumer?.name?.toLowerCase() || '';
    const consumerAddr = conn.consumer?.address?.toLowerCase() || '';
    const connId = conn.connectionId?.toString() || '';

    const matchesSearch =
      consumerName.includes(q) || consumerAddr.includes(q) || connId.includes(q);

    return matchesType && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Water Grid Connections</h1>
          <p className="page-subtitle">
            Physical supply endpoints, meter lines, and consumer infrastructure.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={17} />
          <span>Provision Connection</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${typeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            <span>All Types ({connections.length})</span>
          </button>
          <button
            className={`filter-tab ${typeFilter === 'DOMESTIC' ? 'active' : ''}`}
            onClick={() => setTypeFilter('DOMESTIC')}
          >
            <Home size={15} />
            <span>
              Domestic (
              {
                connections.filter((c) => (c.connectionType || '').toLowerCase() === 'domestic')
                  .length
              }
              )
            </span>
          </button>
          <button
            className={`filter-tab ${typeFilter === 'COMMERCIAL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('COMMERCIAL')}
          >
            <Building size={15} />
            <span>
              Commercial (
              {
                connections.filter(
                  (c) => (c.connectionType || '').toLowerCase() === 'commercial'
                ).length
              }
              )
            </span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, consumer name, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Connections Table */}
      {loading ? (
        <LoadingSpinner message="Fetching grid connections..." />
      ) : filteredConnections.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No connections found"
          description={
            searchQuery
              ? `No connections match "${searchQuery}"`
              : 'Provision a water connection to link consumers to the municipal supply line.'
          }
          actionLabel={!searchQuery ? 'Provision First Connection' : null}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Conn ID</th>
                <th>Assigned Consumer</th>
                <th>Supply Type</th>
                <th>Provision Date</th>
                <th>Service Address</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConnections.map((conn) => {
                const isCommercial = (conn.connectionType || '').toLowerCase() === 'commercial';
                return (
                  <tr key={conn.connectionId}>
                    <td className="font-mono text-semibold text-cyan">
                      #{conn.connectionId}
                    </td>
                    <td>
                      <div className="table-consumer-info">
                        <div className="consumer-avatar avatar-sm">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {conn.consumer?.name || `Consumer #${conn.consumer?.consumerId}`}
                          </div>
                          <span className="text-xs text-muted">
                            Phone: {conn.consumer?.phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-chip ${
                          isCommercial ? 'chip-purple' : 'chip-blue'
                        }`}
                      >
                        {isCommercial ? <Building size={12} /> : <Home size={12} />}
                        {conn.connectionType || 'Domestic'}
                      </span>
                    </td>
                    <td>
                      <div className="table-meta-item">
                        <Calendar size={14} className="text-muted" />
                        <span>{conn.connectionDate || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">{conn.consumer?.address || '—'}</span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-action-primary"
                          title="Record meter reading for this connection"
                          onClick={() => navigate(`/admin/readings?newConnId=${conn.connectionId}`)}
                        >
                          <Gauge size={14} />
                          <span>Record Reading</span>
                        </button>
                        <button
                          className="btn-action btn-delete"
                          title="Delete Connection"
                          onClick={() => {
                            setSelectedConnection(conn);
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

      {/* Provision Connection Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision Water Grid Connection"
        subtitle="Assign a meter pipeline connection to a registered consumer"
      >
        <form onSubmit={handleCreateConnection} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="conn-consumer">
              Select Registered Consumer *
            </label>
            <select
              id="conn-consumer"
              required
              className="form-select"
              value={formData.consumerId}
              onChange={(e) => setFormData({ ...formData, consumerId: e.target.value })}
            >
              <option value="">-- Choose Consumer --</option>
              {consumers.map((c) => (
                <option key={c.consumerId} value={c.consumerId}>
                  #{c.consumerId} — {c.name} ({c.address})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conn-type">
              Connection Category / Tariff Type *
            </label>
            <select
              id="conn-type"
              className="form-select"
              value={formData.connectionType}
              onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
            >
              <option value="Domestic">Domestic (Residential standard tariff)</option>
              <option value="Commercial">Commercial (Business / Retail tariff)</option>
              <option value="Industrial">Industrial (Heavy usage tariff)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="conn-date">
              Installation / Activation Date *
            </label>
            <input
              id="conn-date"
              type="date"
              required
              className="form-input"
              value={formData.connectionDate}
              onChange={(e) => setFormData({ ...formData, connectionDate: e.target.value })}
            />
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
              {submitting ? 'Provisioning...' : 'Provision Connection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Connection Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Decommission Connection"
        subtitle={`Connection #${selectedConnection?.connectionId}`}
      >
        <div className="delete-confirm-box">
          <p>
            Are you sure you want to decommission water connection{' '}
            <strong>#{selectedConnection?.connectionId}</strong> assigned to{' '}
            <strong>"{selectedConnection?.consumer?.name}"</strong>?
          </p>
          <p className="delete-warning">
            Note: All linked meter readings must be cleared before this connection can be removed.
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
              {submitting ? 'Decommissioning...' : 'Decommission'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Connections;
