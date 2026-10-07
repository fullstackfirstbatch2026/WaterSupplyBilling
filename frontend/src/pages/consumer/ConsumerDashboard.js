import React, { useState, useEffect, useCallback } from 'react';
import {
  Droplets,
  Network,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  BarChart2,
  Calendar,
  Activity,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { connectionService, billService, readingService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

// Helper to safely extract property values from objects with unknown key casing
const getVal = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    const lk = k.toLowerCase();
    if (obj[lk] !== undefined && obj[lk] !== null) return obj[lk];
    const uk = k.toUpperCase();
    if (obj[uk] !== undefined && obj[uk] !== null) return obj[uk];
  }
  return undefined;
};

const ConsumerDashboard = () => {
  const { auth } = useAuth();
  const consumer = auth?.consumer;

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [bills, setBills] = useState([]);

  // Selected connection for Analytics & Insights
  const [selectedConnId, setSelectedConnId] = useState(null);

  // Analytics states
  const [usageTrend, setUsageTrend] = useState([]);
  const [billPrediction, setBillPrediction] = useState(null);
  const [usageInsight, setUsageInsight] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Load basic consumer connections and bills
  useEffect(() => {
    if (!consumer?.consumerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [connList, billList] = await Promise.all([
          connectionService.getByConsumer(consumer.consumerId).catch(() => []),
          billService.getByConsumer(consumer.consumerId).catch(() => []),
        ]);
        setConnections(connList);
        if (connList.length > 0) {
          setSelectedConnId(connList[0].connectionId);
        }
        const sorted = [...billList].sort((a, b) => b.billId - a.billId);
        setBills(sorted);
      } catch (err) {
        console.error('Error loading consumer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [consumer?.consumerId]);

  // Load analytics when selected connection changes
  const loadAnalytics = useCallback(async (connId) => {
    if (!connId) return;
    setAnalyticsLoading(true);
    try {
      const [trend, prediction, insight] = await Promise.all([
        readingService.getUsageTrend(connId).catch(() => []),
        readingService.getBillPrediction(connId).catch(() => null),
        readingService.getUsageInsight(connId).catch(() => []),
      ]);
      setUsageTrend(trend || []);
      setBillPrediction(prediction);
      setUsageInsight(insight || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConnId) {
      loadAnalytics(selectedConnId);
    }
  }, [selectedConnId, loadAnalytics]);

  if (loading) return <LoadingSpinner message="Loading your account..." />;

  const unpaidBills = bills.filter((b) => b.billingStatus !== 'PAID');
  const paidBills = bills.filter((b) => b.billingStatus === 'PAID');
  const totalPaid = paidBills.reduce((sum, b) => sum + parseFloat(b.waterCharge || 0), 0);
  const totalDue = unpaidBills.reduce((sum, b) => sum + parseFloat(b.waterCharge || 0), 0);
  const latestBill = bills[0] || null;
  const recentBills = bills.slice(0, 5);

  // Normalize Trend Data for Charting
  const chartPoints = (usageTrend || []).map((item, idx) => ({
    date: getVal(item, 'readingDate', 'reading_date') || `Reading #${idx + 1}`,
    consumption: Number(getVal(item, 'consumption') ?? 0),
  }));

  // Normalize Bill Prediction
  const predUnits = Number(getVal(billPrediction, 'predictedUnits', 'predicted_units') ?? 0);
  const predBill = Number(getVal(billPrediction, 'predictedBill', 'predicted_bill') ?? 0);

  // Normalize Usage Insight
  const insightList = (usageInsight || []).map((item) => ({
    date: getVal(item, 'readingDate', 'reading_date') || 'N/A',
    consumption: Number(getVal(item, 'consumption') ?? 0),
    change: getVal(item, 'consumptionChange', 'consumption_change'),
  }));

  const latestInsight = insightList.length > 0 ? insightList[insightList.length - 1] : null;

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="consumer-welcome-header">
        <div className="consumer-welcome-avatar">
          {consumer?.name ? consumer.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <div>
          <h1 className="page-title">Welcome back, {consumer?.name ? consumer.name.split(' ')[0] : 'Consumer'}!</h1>
          <p className="page-subtitle">
            Here's a complete summary of your water supply account and smart analytics.
          </p>
        </div>
        {unpaidBills.length > 0 && (
          <div className="consumer-alert-badge">
            <AlertTriangle size={16} />
            <span>{unpaidBills.length} bill{unpaidBills.length > 1 ? 's' : ''} due</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="consumer-stats-grid">
        <div className="consumer-stat-card consumer-stat-blue">
          <div className="consumer-stat-icon"><Network size={22} /></div>
          <div className="consumer-stat-body">
            <div className="consumer-stat-value">{connections.length}</div>
            <div className="consumer-stat-label">Active Connection{connections.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="consumer-stat-card consumer-stat-amber">
          <div className="consumer-stat-icon"><Clock size={22} /></div>
          <div className="consumer-stat-body">
            <div className="consumer-stat-value">₹{totalDue.toFixed(2)}</div>
            <div className="consumer-stat-label">Amount Due</div>
          </div>
        </div>

        <div className="consumer-stat-card consumer-stat-green">
          <div className="consumer-stat-icon"><CheckCircle size={22} /></div>
          <div className="consumer-stat-body">
            <div className="consumer-stat-value">₹{totalPaid.toFixed(2)}</div>
            <div className="consumer-stat-label">Total Paid</div>
          </div>
        </div>

        <div className="consumer-stat-card consumer-stat-cyan">
          <div className="consumer-stat-icon"><Receipt size={22} /></div>
          <div className="consumer-stat-body">
            <div className="consumer-stat-value">{bills.length}</div>
            <div className="consumer-stat-label">Total Bills</div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* THREE NEW FEATURES: WATER USAGE TREND, PREDICTION, USAGE INSIGHT        */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <div className="analytics-section">
        <div className="analytics-header">
          <div className="analytics-title">
            <Activity size={20} className="text-cyan" />
            <span>Water Supply Intelligence & Consumption Analytics</span>
          </div>

          {/* Connection Switcher Dropdown */}
          {connections.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-xs text-muted font-medium">Select Connection:</span>
              <select
                className="connection-select-dropdown"
                value={selectedConnId || ''}
                onChange={(e) => setSelectedConnId(Number(e.target.value))}
              >
                {connections.map((c) => (
                  <option key={c.connectionId} value={c.connectionId}>
                    Connection #{c.connectionId} ({c.connectionType || 'Domestic'})
                  </option>
                ))}
              </select>
            </div>
          ) : connections.length === 1 ? (
            <span className="status-chip chip-blue">
              Connection #{connections[0].connectionId} ({connections[0].connectionType || 'Domestic'})
            </span>
          ) : null}
        </div>

        {analyticsLoading ? (
          <div className="panel-card" style={{ padding: '32px', textAlign: 'center' }}>
            <span className="text-muted">Loading consumption insights...</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="panel-card" style={{ padding: '32px', textAlign: 'center' }}>
            <Droplets size={36} className="text-muted" style={{ margin: '0 auto 12px' }} />
            <div className="text-muted">No active connections found for your account.</div>
          </div>
        ) : (
          <div className="panel-card" style={{ marginBottom: '24px' }}>
            {/* Feature 1: Water Usage Trend Chart */}
            <div style={{ marginBottom: '24px' }}>
              <div className="panel-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div>
                  <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={18} className="text-cyan" />
                    Water Usage Trend
                  </h3>
                  <p className="panel-subtitle">Consumption history across meter reading dates (Units in kL)</p>
                </div>
                <span className="status-chip chip-cyan" style={{ fontSize: '0.75rem' }}>
                  {chartPoints.length} Reading{chartPoints.length !== 1 ? 's' : ''} Recorded
                </span>
              </div>

              <div style={{ height: 260, width: '100%', marginTop: '16px' }}>
                {chartPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                        }}
                        formatter={(val) => [`${val} kL (Units)`, 'Consumption']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="consumption"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#usageGradient)"
                        dot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Droplets size={32} className="text-muted" style={{ marginBottom: '8px' }} />
                    <span className="text-muted">No meter reading data available for usage trend.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-grid for Features 2 & 3 */}
            <div className="analytics-grid-three">
              {/* Feature 2: Next Bill Prediction */}
              <div className="analytics-card" style={{ background: '#fafafa', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} style={{ color: '#06b6d4' }} />
                      <h4 className="font-semibold" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        Next Bill Prediction
                      </h4>
                    </div>
                    <span className="status-chip chip-purple" style={{ fontSize: '0.75rem' }}>
                      Smart Forecast
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Estimated units and projected bill charge calculated based on historical consumption averages and municipal tariff slabs.
                  </p>

                  <div className="prediction-box-gradient">
                    <div className="prediction-stat-row">
                      <span className="prediction-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={15} className="text-cyan" /> Predicted Usage:
                      </span>
                      <span className="prediction-value-large">{predUnits} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Units</span></span>
                    </div>

                    <div className="prediction-stat-row">
                      <span className="prediction-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={15} style={{ color: '#0d9488' }} /> Predicted Bill Amount:
                      </span>
                      <span className="prediction-bill-large">₹{predBill.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted" style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} />
                  <span>Next billing period estimate based on connection #{selectedConnId}</span>
                </div>
              </div>

              {/* Feature 3: Usage Insight */}
              <div className="analytics-card" style={{ background: '#fafafa', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={18} style={{ color: '#3b82f6' }} />
                      <h4 className="font-semibold" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        Usage Insight
                      </h4>
                    </div>

                    {/* Dynamic Insight Badge */}
                    {latestInsight ? (
                      latestInsight.change !== undefined && latestInsight.change !== null ? (
                        Number(latestInsight.change) > 0 ? (
                          <span className="insight-badge insight-badge-increased">
                            <TrendingUp size={14} /> Increased
                          </span>
                        ) : Number(latestInsight.change) < 0 ? (
                          <span className="insight-badge insight-badge-decreased">
                            <TrendingDown size={14} /> Decreased
                          </span>
                        ) : (
                          <span className="insight-badge insight-badge-unchanged">
                            <Minus size={14} /> Unchanged
                          </span>
                        )
                      ) : (
                        <span className="insight-badge insight-badge-baseline">
                          <Activity size={14} /> Baseline
                        </span>
                      )
                    ) : (
                      <span className="insight-badge insight-badge-baseline">
                        No Data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    Analyzes consumption changes between consecutive reading cycles to encourage efficient water usage.
                  </p>

                  {/* Insight Message Box */}
                  {latestInsight ? (
                    (() => {
                      const changeVal = latestInsight.change !== undefined && latestInsight.change !== null ? Number(latestInsight.change) : null;
                      if (changeVal !== null && changeVal > 0) {
                        return (
                          <div className="insight-box insight-box-increased">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700 }}>
                              <TrendingUp size={18} />
                              <span>Usage Increased by {changeVal} Units</span>
                            </div>
                            <p className="text-xs" style={{ color: '#92400e', margin: 0 }}>
                              Your latest reading recorded a <strong>+{changeVal} kL</strong> increase compared to your previous reading date ({latestInsight.date}). Consider checking for leaks or optimizing daily supply usage.
                            </p>
                          </div>
                        );
                      } else if (changeVal !== null && changeVal < 0) {
                        return (
                          <div className="insight-box insight-box-decreased">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700 }}>
                              <TrendingDown size={18} />
                              <span>Usage Decreased by {Math.abs(changeVal)} Units</span>
                            </div>
                            <p className="text-xs" style={{ color: '#065f46', margin: 0 }}>
                              Great job conserving water! Your usage dropped by <strong>{Math.abs(changeVal)} kL</strong> compared to your previous billing cycle.
                            </p>
                          </div>
                        );
                      } else if (changeVal !== null && changeVal === 0) {
                        return (
                          <div className="insight-box insight-box-unchanged">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: 700 }}>
                              <Minus size={18} />
                              <span>Steady Usage (0 Unit Change)</span>
                            </div>
                            <p className="text-xs" style={{ color: '#075985', margin: 0 }}>
                              Your water consumption remained perfectly consistent with your prior recorded reading.
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="insight-box insight-box-baseline">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 700 }}>
                              <Activity size={18} />
                              <span>Baseline Reading ({latestInsight.consumption} Units)</span>
                            </div>
                            <p className="text-xs" style={{ color: '#475569', margin: 0 }}>
                              Initial meter reading registered. Comparative trend metrics will be automatically calculated when your next meter reading is posted.
                            </p>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="insight-box insight-box-baseline">
                      <span className="text-xs text-muted">No meter reading insights available yet for this connection.</span>
                    </div>
                  )}
                </div>

                {/* History mini log */}
                {insightList.length > 1 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    <div className="text-xs font-semibold text-muted" style={{ marginBottom: '6px' }}>Reading Change History:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto' }}>
                      {insightList.slice(-3).reverse().map((item, i) => {
                        const chg = item.change !== undefined && item.change !== null ? Number(item.change) : null;
                        return (
                          <div key={i} className="text-xs" style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                            <span>{item.date}:</span>
                            <span className="font-mono" style={{ fontWeight: 600, color: chg > 0 ? '#b45309' : chg < 0 ? '#047857' : '#64748b' }}>
                              {chg === null ? 'Baseline' : chg > 0 ? `+${chg} kL` : `${chg} kL`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Current Bill & Connection Details */}
      <div className="consumer-dashboard-grid">
        {/* Current Bill */}
        {latestBill ? (
          <div className="panel-card consumer-current-bill-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Current Bill</h3>
                <p className="panel-subtitle">Most recent billing statement</p>
              </div>
              <Link to="/portal/bills" className="link-action">
                All Bills <ArrowRight size={14} />
              </Link>
            </div>
            <div className="current-bill-amount-display">
              <span className="current-bill-currency">₹</span>
              <span className="current-bill-amount">
                {parseFloat(latestBill.waterCharge).toFixed(2)}
              </span>
            </div>
            <div className="current-bill-details">
              <div className="current-bill-row">
                <span>Bill #</span>
                <span className="font-semibold">#{latestBill.billId}</span>
              </div>
              <div className="current-bill-row">
                <span>Units Consumed</span>
                <span className="font-semibold">{latestBill.consumption} kL</span>
              </div>
              <div className="current-bill-row">
                <span>Bill Date</span>
                <span className="font-semibold">{latestBill.billDate || 'N/A'}</span>
              </div>
              <div className="current-bill-row">
                <span>Status</span>
                <span
                  className={`status-chip ${
                    latestBill.billingStatus === 'PAID' ? 'chip-paid' : 'chip-unpaid'
                  }`}
                >
                  {latestBill.billingStatus === 'PAID' ? (
                    <><CheckCircle size={12} /> Paid</>
                  ) : (
                    <><Clock size={12} /> Unpaid</>
                  )}
                </span>
              </div>
            </div>
            {latestBill.billingStatus !== 'PAID' && (
              <Link to="/portal/payments" className="consumer-pay-now-btn">
                <CreditCardIcon size={16} />
                Pay Now
              </Link>
            )}
          </div>
        ) : (
          <div className="panel-card">
            <div className="panel-header">
              <h3 className="panel-title">Current Bill</h3>
            </div>
            <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
              No bills issued yet for your account.
            </div>
          </div>
        )}

        {/* Connection Summary */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">My Connection</h3>
              <p className="panel-subtitle">Your registered water supply details</p>
            </div>
            <Link to="/portal/connection" className="link-action">
              Details <ArrowRight size={14} />
            </Link>
          </div>
          {connections.length > 0 ? (
            <div className="consumer-connection-list">
              {connections.map((conn) => (
                <div key={conn.connectionId} className="consumer-connection-item">
                  <div className="consumer-connection-icon">
                    <Droplets size={20} />
                  </div>
                  <div className="consumer-connection-details">
                    <div className="consumer-connection-title">Connection #{conn.connectionId}</div>
                    <div className="consumer-connection-meta">
                      {conn.connectionType} Supply · Since {conn.connectionDate || 'N/A'}
                    </div>
                  </div>
                  <span className="status-chip chip-blue">{conn.connectionType}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
              No active connections registered.
            </div>
          )}
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="panel-card" style={{ marginTop: '20px' }}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Recent Bills</h3>
            <p className="panel-subtitle">Your latest water billing statements</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={18} className="text-muted" />
            <Link to="/portal/bills" className="link-action">
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        {recentBills.length > 0 ? (
          <div className="table-card" style={{ marginTop: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Units</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((b) => (
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
                          <><Clock size={12} /> Due</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
            No bills found.
          </div>
        )}
      </div>
    </div>
  );
};

// Inline icon to avoid import issue
const CreditCardIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export default ConsumerDashboard;
