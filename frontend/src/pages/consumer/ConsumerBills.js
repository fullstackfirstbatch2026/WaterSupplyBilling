import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, Clock, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { billService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const ConsumerBills = () => {
  const { auth } = useAuth();
  const consumer = auth.consumer;
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL | PAID | UNPAID

  useEffect(() => {
    const load = async () => {
      try {
        const list = await billService.getByConsumer(consumer.consumerId);
        setBills([...list].sort((a, b) => b.billId - a.billId));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [consumer.consumerId]);

  if (loading) return <LoadingSpinner message="Loading your bills..." />;

  const filtered = bills.filter((b) => {
    if (filter === 'PAID') return b.billingStatus === 'PAID';
    if (filter === 'UNPAID') return b.billingStatus !== 'PAID';
    return true;
  });

  const totalDue = bills
    .filter((b) => b.billingStatus !== 'PAID')
    .reduce((s, b) => s + parseFloat(b.waterCharge || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bills</h1>
          <p className="page-subtitle">
            View all your water billing statements and payment history.
          </p>
        </div>
        {totalDue > 0 && (
          <div className="consumer-due-badge">
            <Clock size={16} />
            <span>₹{totalDue.toFixed(2)} outstanding</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="control-bar">
        <div className="filter-tabs">
          {['ALL', 'UNPAID', 'PAID'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              <Filter size={14} />
              <span>
                {f === 'ALL' ? `All Bills (${bills.length})` : f === 'UNPAID' ? `Unpaid (${bills.filter(b => b.billingStatus !== 'PAID').length})` : `Paid (${bills.filter(b => b.billingStatus === 'PAID').length})`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Receipt size={48} className="text-muted" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No bills found</h3>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Bill Date</th>
                <th>Units Consumed</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.billId}>
                  <td className="font-mono text-muted">#{b.billId}</td>
                  <td>{b.billDate || 'N/A'}</td>
                  <td>{b.consumption} kL</td>
                  <td className="font-semibold text-cyan">₹{parseFloat(b.waterCharge).toFixed(2)}</td>
                  <td>
                    <span className={`status-chip ${b.billingStatus === 'PAID' ? 'chip-paid' : 'chip-unpaid'}`}>
                      {b.billingStatus === 'PAID' ? (
                        <><CheckCircle size={12} /> Paid</>
                      ) : (
                        <><Clock size={12} /> Unpaid</>
                      )}
                    </span>
                  </td>
                  <td>
                    {b.billingStatus !== 'PAID' ? (
                      <Link
                        to={`/portal/payments?billId=${b.billId}`}
                        className="consumer-pay-link"
                      >
                        Pay Now
                      </Link>
                    ) : (
                      <span className="text-muted text-sm">
                        Paid {b.paymentDate ? `on ${b.paymentDate}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConsumerBills;
