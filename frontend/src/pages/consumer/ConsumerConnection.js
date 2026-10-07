import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Calendar,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { connectionService, readingService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

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

const ConnectionAnalyticsItem = ({ connectionId }) => {
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [insight, setInsight] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [predData, insightData, trendData] = await Promise.all([
          readingService.getBillPrediction(connectionId).catch(() => null),
          readingService.getUsageInsight(connectionId).catch(() => []),
          readingService.getUsageTrend(connectionId).catch(() => []),
        ]);
        if (isMounted) {
          setPrediction(predData);
          setInsight(insightData || []);
          setTrend(trendData || []);
        }
      } catch (e) {
        console.error('Error fetching connection analytics:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [connectionId]);

  if (loading) {
    return <div className="text-xs text-muted" style={{ padding: '12px' }}>Loading analytics...</div>;
  }

  const predUnits = Number(getVal(prediction, 'predictedUnits', 'predicted_units') ?? 0);
  const predBill = Number(getVal(prediction, 'predictedBill', 'predicted_bill') ?? 0);

  const insightList = (insight || []).map((item) => ({
    date: getVal(item, 'readingDate', 'reading_date') || 'N/A',
    consumption: Number(getVal(item, 'consumption') ?? 0),
    change: getVal(item, 'consumptionChange', 'consumption_change'),
  }));
  const latestInsight = insightList.length > 0 ? insightList[insightList.length - 1] : null;

  return (
    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Activity size={15} className="text-cyan" />
        Connection Insights & Forecast
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Next Bill Prediction */}
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
          <div className="text-xs text-muted font-medium" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <Sparkles size={13} className="text-cyan" /> Next Bill Prediction
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>
            {predUnits} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Units</span>
          </div>
          <div className="text-xs font-semibold text-emerald-600" style={{ marginTop: '2px', color: '#0d9488' }}>
            Est. ₹{predBill.toFixed(2)}
          </div>
        </div>

        {/* Usage Insight */}
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
          <div className="text-xs text-muted font-medium" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <BarChart2 size={13} className="text-blue" /> Usage Insight
          </div>
          {latestInsight ? (
            (() => {
              const chg = latestInsight.change !== undefined && latestInsight.change !== null ? Number(latestInsight.change) : null;
              if (chg !== null && chg > 0) {
                return (
                  <div className="text-xs font-semibold" style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> +{chg} Units Increase
                  </div>
                );
              } else if (chg !== null && chg < 0) {
                return (
                  <div className="text-xs font-semibold" style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingDown size={14} /> {chg} Units Decrease
                  </div>
                );
              } else if (chg === 0) {
                return (
                  <div className="text-xs font-semibold" style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Minus size={14} /> Unchanged Usage
                  </div>
                );
              } else {
                return (
                  <div className="text-xs text-muted">
                    Baseline: {latestInsight.consumption} Units
                  </div>
                );
              }
            })()
          ) : (
            <div className="text-xs text-muted">No readings recorded yet</div>
          )}
          <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
            {trend.length} total reading{trend.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsumerConnection = () => {
  const { auth } = useAuth();
  const consumer = auth?.consumer;
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (!consumer?.consumerId) return;
    const load = async () => {
      try {
        const list = await connectionService.getByConsumer(consumer.consumerId);
        setConnections(list || []);
      } catch (err) {
        console.error('Error fetching connections:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [consumer?.consumerId]);

  if (loading) return <LoadingSpinner message="Loading your connection details..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Connection</h1>
          <p className="page-subtitle">Your registered water supply connection details & consumption analytics.</p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Droplets size={48} className="text-muted" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'var(--text-muted)' }}>No active connections</h3>
          <p className="page-subtitle">Contact your municipality to register a water connection.</p>
        </div>
      ) : (
        <div className="consumer-connection-cards">
          {connections.map((conn) => (
            <div key={conn.connectionId} className="consumer-connection-card-detail">
              <div className="consumer-connection-card-header">
                <div className="consumer-connection-card-icon">
                  <Droplets size={28} />
                </div>
                <div>
                  <h3 className="consumer-connection-card-title">
                    Connection #{conn.connectionId}
                  </h3>
                  <span className={`status-chip ${conn.connectionType?.toLowerCase() === 'commercial' ? 'chip-purple' : 'chip-blue'}`}>
                    {conn.connectionType || 'Domestic'}
                  </span>
                </div>
              </div>

              <div className="consumer-connection-card-body">
                <div className="consumer-detail-row">
                  <span className="consumer-detail-label">
                    <Calendar size={14} /> Connection Date
                  </span>
                  <span className="consumer-detail-value">{conn.connectionDate || 'N/A'}</span>
                </div>
                <div className="consumer-detail-row">
                  <span className="consumer-detail-label">
                    <MapPin size={14} /> Service Address
                  </span>
                  <span className="consumer-detail-value">{consumer?.address}</span>
                </div>
                <div className="consumer-detail-row">
                  <span className="consumer-detail-label">
                    <Phone size={14} /> Contact
                  </span>
                  <span className="consumer-detail-value">{consumer?.phone}</span>
                </div>
                <div className="consumer-detail-row">
                  <span className="consumer-detail-label">Supply Type</span>
                  <span className="consumer-detail-value">{conn.connectionType || 'Domestic'}</span>
                </div>

                {/* Inline analytics summary component */}
                <ConnectionAnalyticsItem connectionId={conn.connectionId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsumerConnection;
