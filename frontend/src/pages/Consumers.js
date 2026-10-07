import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Flame,
  Network,
  Receipt,
} from 'lucide-react';
import { consumerService, connectionService, billService } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const Consumers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [consumers, setConsumers] = useState([]);
  const [aboveAverageConsumers, setAboveAverageConsumers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(
    filterParam === 'above-average' ? 'above-average' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected consumer for edit / view / delete
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [consumerConnections, setConsumerConnections] = useState([]);
  const [consumerBills, setConsumerBills] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    if (filterParam === 'above-average') {
      setActiveFilter('above-average');
    }
  }, [filterParam]);

  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const [allList, aboveAvgList] = await Promise.all([
        consumerService.getAll(),
        consumerService.getAboveAverage().catch(() => []),
      ]);
      if (Array.isArray(allList)) {
        setConsumers(allList);
      }
      if (Array.isArray(aboveAvgList)) {
        setAboveAverageConsumers(aboveAvgList);
      }
    } catch (err) {
      console.error('Failed to load consumers list:', err);
      if (showLoadingSpinner) {
        toast.error('Failed to load consumers list');
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', address: '', phone: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (consumer) => {
    setSelectedConsumer(consumer);
    setFormData({
      name: consumer.name || '',
      address: consumer.address || '',
      phone: consumer.phone || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (consumer) => {
    setSelectedConsumer(consumer);
    setIsDeleteModalOpen(true);
  };

  const handleOpenView = async (consumer) => {
    setSelectedConsumer(consumer);
    setIsViewModalOpen(true);
    setLoadingProfile(true);
    try {
      const [connections, bills] = await Promise.all([
        connectionService.getByConsumer(consumer.consumerId).catch(() => []),
        billService.getByConsumer(consumer.consumerId).catch(() => []),
      ]);
      setConsumerConnections(connections);
      setConsumerBills(bills);
    } catch (err) {
      toast.error('Failed to load consumer profile details');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveConsumer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all consumer fields');
      return;
    }
    setSubmitting(true);
    try {
      if (selectedConsumer && isEditModalOpen) {
        const updated = await consumerService.update(selectedConsumer.consumerId, formData);
        const updatedConsumer = updated || { ...selectedConsumer, ...formData };
        setConsumers((prev) =>
          prev.map((c) => (c.consumerId === selectedConsumer.consumerId ? updatedConsumer : c))
        );
        toast.success(`Consumer ${formData.name} updated successfully!`);
        setIsEditModalOpen(false);
      } else {
        const newConsumer = await consumerService.create(formData);
        if (newConsumer) {
          setConsumers((prev) => {
            const exists = prev.some((c) => c.consumerId === newConsumer.consumerId);
            return exists
              ? prev.map((c) => (c.consumerId === newConsumer.consumerId ? newConsumer : c))
              : [...prev, newConsumer];
          });
        }
        toast.success(`Consumer ${formData.name} added successfully!`);
        setIsAddModalOpen(false);
        setFormData({ name: '', address: '', phone: '' });
      }
      await loadData(false);
    } catch (err) {
      toast.error(`Error saving consumer: ${err.message || 'Request failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedConsumer) return;
    setSubmitting(true);
    try {
      await consumerService.delete(selectedConsumer.consumerId);
      setConsumers((prev) => prev.filter((c) => c.consumerId !== selectedConsumer.consumerId));
      setAboveAverageConsumers((prev) =>
        prev.filter((c) => c.consumerId !== selectedConsumer.consumerId)
      );
      toast.success(
        `Consumer "${selectedConsumer.name}" and all linked records deleted successfully.`
      );
      setIsDeleteModalOpen(false);
      await loadData(false);
    } catch (err) {
      toast.error('Failed to delete consumer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine which list to display based on filter
  const isAboveAverage = (consumerId) => {
    return aboveAverageConsumers.some((c) => c.consumerId === consumerId);
  };

  const displayedConsumers = (
    activeFilter === 'above-average' ? aboveAverageConsumers : consumers
  ).filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.consumerId?.toString().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Consumer Management</h1>
          <p className="page-subtitle">
            Manage registered water consumers, service addresses, and linked billing accounts.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={17} />
          <span>Add Consumer</span>
        </button>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="control-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('all');
              setSearchParams({});
            }}
          >
            <Users size={15} />
            <span>All Consumers ({consumers.length})</span>
          </button>
          <button
            className={`filter-tab tab-highlight ${
              activeFilter === 'above-average' ? 'active' : ''
            }`}
            onClick={() => {
              setActiveFilter('above-average');
              setSearchParams({ filter: 'above-average' });
            }}
            title="Consumers with consumption greater than average consumption"
          >
            <Flame size={15} className="text-amber" />
            <span>Above Average Usage ({aboveAverageConsumers.length})</span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, address, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notice banner when viewing Above Average filter */}
      {activeFilter === 'above-average' && (
        <div className="info-banner banner-amber">
          <Flame size={18} className="text-amber" />
          <div>
            <strong>Showing High Consumption Consumers:</strong> These consumers have bills
            exceeding the average water consumption threshold calculated dynamically across the
            entire municipality.
          </div>
        </div>
      )}

      {/* Consumers Table */}
      {loading ? (
        <LoadingSpinner message="Fetching consumer records..." />
      ) : displayedConsumers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No consumers found"
          description={
            searchQuery
              ? `No consumers match "${searchQuery}"`
              : activeFilter === 'above-average'
              ? 'No consumers currently exceed the municipal average.'
              : 'Start by adding your first water supply consumer.'
          }
          actionLabel={activeFilter === 'all' && !searchQuery ? 'Add New Consumer' : null}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Consumer Name</th>
                <th>Service Address</th>
                <th>Phone Number</th>
                <th>Usage Tier</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedConsumers.map((consumer) => {
                const highUsage = isAboveAverage(consumer.consumerId);
                return (
                  <tr key={consumer.consumerId}>
                    <td className="font-mono text-muted">#{consumer.consumerId}</td>
                    <td>
                      <div className="table-consumer-info">
                        <div className="consumer-avatar avatar-sm">
                          {consumer.name ? consumer.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <span className="font-semibold">{consumer.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-meta-item">
                        <MapPin size={14} className="text-muted" />
                        <span>{consumer.address}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-meta-item">
                        <Phone size={14} className="text-muted" />
                        <span>{consumer.phone}</span>
                      </div>
                    </td>
                    <td>
                      {highUsage ? (
                        <span className="status-chip chip-amber" title="Consumption exceeds average threshold">
                          <Flame size={12} /> High Usage
                        </span>
                      ) : (
                        <span className="status-chip chip-neutral">Standard</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-action btn-view"
                          title="View Consumer Profile & Connections"
                          onClick={() => handleOpenView(consumer)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-action btn-edit"
                          title="Edit Consumer"
                          onClick={() => handleOpenEdit(consumer)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-action btn-delete"
                          title="Delete Consumer"
                          onClick={() => handleOpenDelete(consumer)}
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

      {/* Add / Edit Consumer Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? `Edit Consumer #${selectedConsumer?.consumerId}` : 'Add New Water Consumer'}
        subtitle="Enter consumer contact and residential details"
      >
        <form onSubmit={handleSaveConsumer} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="consumer-name">
              Full Name *
            </label>
            <input
              id="consumer-name"
              type="text"
              required
              className="form-input"
              placeholder="e.g. Arun Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="consumer-address">
              Service Address / Location *
            </label>
            <input
              id="consumer-address"
              type="text"
              required
              className="form-input"
              placeholder="e.g. 14 Anna Salai, Chennai"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="consumer-phone">
              Phone Number *
            </label>
            <input
              id="consumer-phone"
              type="text"
              required
              className="form-input"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Create Consumer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Consumer Profile Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Consumer Profile & History"
        subtitle={`Consumer #${selectedConsumer?.consumerId}: ${selectedConsumer?.name}`}
        maxWidth="680px"
      >
        {selectedConsumer && (
          <div className="profile-view">
            <div className="profile-summary-card">
              <div className="profile-avatar-lg">
                {selectedConsumer.name ? selectedConsumer.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="profile-info">
                <h3>{selectedConsumer.name}</h3>
                <div className="profile-badges">
                  <span className="profile-tag">
                    <MapPin size={13} /> {selectedConsumer.address}
                  </span>
                  <span className="profile-tag">
                    <Phone size={13} /> {selectedConsumer.phone}
                  </span>
                  {isAboveAverage(selectedConsumer.consumerId) && (
                    <span className="status-chip chip-amber">
                      <Flame size={12} /> Above Avg Usage
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loadingProfile ? (
              <LoadingSpinner message="Loading linked connections and bills..." />
            ) : (
              <>
                {/* Linked Connections */}
                <div className="profile-section">
                  <div className="profile-section-header">
                    <div className="flex-row items-center gap-2">
                      <Network size={16} className="text-cyan" />
                      <h4>Water Connections</h4>
                    </div>
                    <span className="badge-count">{consumerConnections.length} Active</span>
                  </div>

                  {consumerConnections.length > 0 ? (
                    <div className="connection-pill-list">
                      {consumerConnections.map((conn) => (
                        <div key={conn.connectionId} className="connection-pill-item">
                          <div className="conn-type-badge">
                            {conn.connectionType || 'Domestic'}
                          </div>
                          <div className="conn-meta">
                            <strong>Connection #{conn.connectionId}</strong>
                            <span className="text-xs text-muted">
                              Installed: {conn.connectionDate || 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted text-sm" style={{ padding: '8px 0' }}>
                      No active water connections registered for this consumer.
                    </div>
                  )}
                </div>

                {/* Linked Bills */}
                <div className="profile-section" style={{ marginTop: '20px' }}>
                  <div className="profile-section-header">
                    <div className="flex-row items-center gap-2">
                      <Receipt size={16} className="text-emerald" />
                      <h4>Billing & Payment History</h4>
                    </div>
                    <span className="badge-count">{consumerBills.length} Invoices</span>
                  </div>

                  {consumerBills.length > 0 ? (
                    <table className="compact-table" style={{ marginTop: '10px' }}>
                      <thead>
                        <tr>
                          <th>Bill #</th>
                          <th>Units</th>
                          <th>Water Charge</th>
                          <th>Bill Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumerBills.map((b) => (
                          <tr key={b.billId}>
                            <td>#{b.billId}</td>
                            <td>{b.consumption} kL</td>
                            <td className="font-semibold text-cyan">₹{parseFloat(b.waterCharge).toFixed(2)}</td>
                            <td>{b.billDate}</td>
                            <td>
                              <span
                                className={`status-chip ${
                                  b.billingStatus === 'PAID' ? 'chip-paid' : 'chip-unpaid'
                                }`}
                              >
                                {b.billingStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-muted text-sm" style={{ padding: '8px 0' }}>
                      No bills issued for this consumer yet.
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Consumer"
        subtitle={`Consumer #${selectedConsumer?.consumerId}`}
      >
        <div className="delete-confirm-box">
          <p>
            Are you sure you want to delete consumer{' '}
            <strong>"{selectedConsumer?.name}"</strong>?
          </p>
          <p className="delete-warning">
            ⚠️ This will permanently delete the consumer and <strong>all linked connections,
            meter readings, and bills</strong>. This action cannot be undone.
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
              {submitting ? 'Deleting...' : 'Yes, Delete Consumer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Consumers;
