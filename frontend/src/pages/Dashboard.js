import React, { useState, useEffect } from 'react';
import {
  Users,
  Network,
  Gauge,
  Receipt,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  consumerService,
  connectionService,
  readingService,
  billService,
  waterBillingService,
} from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consumersCount: 0,
    connectionsCount: 0,
    domesticCount: 0,
    commercialCount: 0,
    readingsCount: 0,
    totalConsumption: 0,
    totalBilledAmount: 0,
    totalPaidAmount: 0,
    paidCount: 0,
    unpaidCount: 0,
  });

  const [aboveAverageConsumers, setAboveAverageConsumers] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Tariff Calculator State
  const [calcUnits, setCalcUnits] = useState(45);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [consumers, connections, readings, bills, aboveAvg] = await Promise.all([
        consumerService.getAll(),
        connectionService.getAll(),
        readingService.getAll(),
        billService.getCompleteDetails().catch(() => billService.getAll()),
        consumerService.getAboveAverage().catch(() => []),
      ]);

      // Calculate stats
      const domestic = connections.filter(
        (c) => (c.connectionType || '').toLowerCase() === 'domestic'
      ).length;
      const commercial = connections.length - domestic;

      let totalCons = 0;
      let totalAmount = 0;
      let paidAmt = 0;
      let paid = 0;
      let unpaid = 0;

      const consumerConsumptionMap = {};

      bills.forEach((b) => {
        const cons = parseFloat(b.consumption) || 0;
        const charge = parseFloat(b.waterCharge) || 0;
        totalCons += cons;
        totalAmount += charge;

        if (b.billingStatus === 'PAID') {
          paid++;
          paidAmt += charge;
        } else {
          unpaid++;
        }

        const cName = b.consumer?.name || `Consumer #${b.consumer?.consumerId || b.consumerId}`;
        consumerConsumptionMap[cName] = (consumerConsumptionMap[cName] || 0) + cons;
      });

      // Prepare chart data for consumption by consumer
      const chartPoints = Object.entries(consumerConsumptionMap).map(([name, units]) => ({
        name,
        consumption: units,
      }));

      setStats({
        consumersCount: consumers.length,
        connectionsCount: connections.length,
        domesticCount: domestic,
        commercialCount: commercial,
        readingsCount: readings.length,
        totalConsumption: totalCons,
        totalBilledAmount: totalAmount,
        totalPaidAmount: paidAmt,
        paidCount: paid,
        unpaidCount: unpaid,
      });

      setAboveAverageConsumers(aboveAvg);
      // Sort bills descending by billId for recent list
      const sortedBills = [...bills].sort((a, b) => b.billId - a.billId).slice(0, 5);
      setRecentBills(sortedBills);
      setChartData(chartPoints);

      // Perform initial calculate charge preview
      handleCalculateCharge(45);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateCharge = async (units) => {
    if (units === '' || isNaN(units) || units < 0) {
      setCalcResult(null);
      return;
    }
    setCalcLoading(true);
    try {
      const charge = await waterBillingService.calculateCharge(parseInt(units, 10));
      setCalcResult(charge);
    } catch (err) {
      console.error('Failed to calculate charge:', err);
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating municipal water records..." />;
  }

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Water Utility Overview</h1>
          <p className="page-subtitle">
            Real-time operations, municipal supply consumption, and revenue analytics.
          </p>
        </div>
        <div className="header-badge">
          <Sparkles size={16} className="text-cyan" />
          <span>Automated Billing Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Consumers"
          value={stats.consumersCount}
          subtitle="Registered water consumers"
          icon={Users}
          color="cyan"
          trend="+ Active Registry"
        />
        <StatCard
          title="Active Connections"
          value={stats.connectionsCount}
          subtitle={`${stats.domesticCount} Domestic • ${stats.commercialCount} Commercial`}
          icon={Network}
          color="blue"
          trend="Municipal Grid"
        />
        <StatCard
          title="Total Consumption"
          value={`${stats.totalConsumption.toFixed(1)} kL`}
          subtitle={`Across ${stats.readingsCount} meter recordings`}
          icon={Gauge}
          color="indigo"
          trend="Cumulative Usage"
        />
        <StatCard
          title="Total Billed Revenue"
          value={`₹${stats.totalBilledAmount.toFixed(2)}`}
          subtitle={`₹${stats.totalPaidAmount.toFixed(2)} Collected (${stats.totalBilledAmount > 0 ? ((stats.totalPaidAmount / stats.totalBilledAmount) * 100).toFixed(0) : 0}%)`}
          icon={Receipt}
          color="emerald"
          trend={`${stats.unpaidCount} Pending Due`}
        />
      </div>

      {/* Interactive Grid: Charts & Calculator */}
      <div className="dashboard-main-grid">
        {/* Chart Section */}
        <div className="panel-card chart-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Water Consumption by Consumer (Units / kL)</h3>
              <p className="panel-subtitle">Aggregated meter readings from billing database</p>
            </div>
            <TrendingUp size={20} className="text-muted" />
          </div>
          <div className="chart-wrapper">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                    formatter={(val) => [`${val} Units`, 'Consumption']}
                  />
                  <Bar dataKey="consumption" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No consumption data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Tariff Calculator */}
        <div className="panel-card calculator-widget-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                Tariff Calculator
              </h3>
              <p className="panel-subtitle">
                Estimate water charges based on consumption units
              </p>
            </div>
          </div>

          <div className="calculator-form">
            <label className="form-label" htmlFor="calc-units-input">
              Enter Units Consumed (kL / Units):
            </label>
            <div className="input-group">
              <input
                id="calc-units-input"
                type="number"
                min="0"
                className="form-input"
                value={calcUnits}
                onChange={(e) => {
                  setCalcUnits(e.target.value);
                  handleCalculateCharge(e.target.value);
                }}
                placeholder="e.g. 45"
              />
              <span className="input-suffix">Units</span>
            </div>

            <div className="calc-result-box">
              <span className="calc-result-label">Computed Water Charge:</span>
              <div className="calc-result-value">
                {calcLoading ? (
                  <span className="text-muted">Calculating...</span>
                ) : calcResult !== null ? (
                  <>
                    <span className="currency-symbol">₹</span>
                    <span className="amount-number">{calcResult.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-muted">Enter valid units</span>
                )}
              </div>
            </div>

            <div className="tariff-slabs-info">
              <div className="slab-title">Tariff Rate Schedule:</div>
              <div className="slab-item">
                <span>0 – 30 Units:</span>
                <strong>₹5 / unit</strong>
              </div>
              <div className="slab-item">
                <span>31 – 50 Units:</span>
                <strong>₹8 / unit</strong>
              </div>
              <div className="slab-item">
                <span>Above 50 Units:</span>
                <strong>₹12 / unit</strong>
              </div>
              <div className="slab-footer-note">
                * Minimum baseline charge of ₹50 automatically applied.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: High Consumption Consumers & Recent Bills */}
      <div className="dashboard-sub-grid">
        {/* High Consumption Consumers */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                High Consumption Consumers
              </h3>
              <p className="panel-subtitle">
                Consumers exceeding the municipal average consumption threshold.
              </p>
            </div>
            <Link to="/admin/consumers?filter=above-average" className="link-action">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="above-avg-list">
            {aboveAverageConsumers.length > 0 ? (
              aboveAverageConsumers.map((consumer) => (
                <div key={consumer.consumerId} className="consumer-item-card">
                  <div className="consumer-avatar">
                    {consumer.name ? consumer.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="consumer-details">
                    <div className="consumer-name">{consumer.name}</div>
                    <div className="consumer-sub">
                      <span>ID: #{consumer.consumerId}</span> • <span>{consumer.address}</span>
                    </div>
                  </div>
                  <div className="consumer-contact">
                    <span className="phone-badge">{consumer.phone}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
                No consumers currently exceeding the average threshold.
              </div>
            )}
          </div>
        </div>

        {/* Recent Generated Bills */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Recent Bills & Invoices</h3>
              <p className="panel-subtitle">Latest issued water utility billing statements</p>
            </div>
            <Link to="/admin/bills" className="link-action">
              All Bills <ArrowRight size={14} />
            </Link>
          </div>

          <div className="recent-bills-table-wrapper">
            {recentBills.length > 0 ? (
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Consumer</th>
                    <th>Units</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((b) => (
                    <tr key={b.billId}>
                      <td className="font-semibold">#{b.billId}</td>
                      <td>
                        <div className="table-consumer-cell">
                          <span className="font-medium">
                            {b.consumer?.name || `Consumer #${b.consumer?.consumerId || b.consumerId}`}
                          </span>
                          <span className="text-xs text-muted">
                            {b.reading?.connection?.connectionType || 'Domestic'}
                          </span>
                        </div>
                      </td>
                      <td>{b.consumption} kL</td>
                      <td className="font-semibold text-cyan">₹{parseFloat(b.waterCharge).toFixed(2)}</td>
                      <td>
                        <span
                          className={`status-chip ${
                            b.billingStatus === 'PAID' ? 'chip-paid' : 'chip-unpaid'
                          }`}
                        >
                          {b.billingStatus === 'PAID' ? (
                            <>
                              <CheckCircle size={12} /> Paid
                            </>
                          ) : (
                            <>
                              <Clock size={12} /> Due
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
                No bills recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
