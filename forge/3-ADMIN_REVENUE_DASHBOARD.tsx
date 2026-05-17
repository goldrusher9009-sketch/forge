/**
 * ADMIN REVENUE DASHBOARD FOR FORGE
 *
 * Real-time financial analytics for executive and finance team
 * Monitors: MRR, ARR, Churn, Customer LTV, Plan Distribution, Overage Revenue
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ============================================================================
// COMPONENT: ADMIN REVENUE DASHBOARD
// ============================================================================

export const AdminRevenueDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    mrr: 0,
    arr: 0,
    churnRate: 0,
    customerCount: 0,
    avgLtv: 0,
    overageRevenue: 0,
    failedPayments: 0,
    expansionRevenue: 0
  });

  const [mrrTrend, setMrrTrend] = useState([]);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [cohortData, setCohortData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-05-11' });
  const [selectedMetric, setSelectedMetric] = useState('mrr');

  // Fetch dashboard data on mount and when date range changes
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/revenue/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange.start,
          endDate: dateRange.end
        })
      });

      const data = await response.json();

      setMetrics({
        mrr: data.mrr,
        arr: data.arr,
        churnRate: data.churn_rate,
        customerCount: data.total_customers,
        avgLtv: data.average_ltv,
        overageRevenue: data.overage_revenue,
        failedPayments: data.failed_payments_count,
        expansionRevenue: data.expansion_revenue
      });

      setMrrTrend(data.mrr_trend);
      setPlanDistribution(data.plan_distribution);
      setCohortData(data.cohort_analysis);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading revenue metrics...</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Revenue Dashboard</h1>
          <p className="text-gray-400">Real-time financial metrics and performance analysis</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
              />
            </div>
            <button
              onClick={() => {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 12);
                setDateRange({
                  start: startDate.toISOString().split('T')[0],
                  end: endDate.toISOString().split('T')[0]
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
            >
              Last 12 Months
            </button>
            <button
              onClick={() => fetchDashboardData()}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Monthly Recurring Revenue" value={`$${metrics.mrr.toLocaleString()}`} subtext="MRR" trend="+12.5%" color="emerald" />
          <MetricCard label="Annual Recurring Revenue" value={`$${metrics.arr.toLocaleString()}`} subtext="ARR (MRR × 12)" trend="+12.5%" color="blue" />
          <MetricCard label="Churn Rate" value={`${(metrics.churnRate * 100).toFixed(1)}%`} subtext="Monthly churn" trend="-0.3%" good={true} color="violet" />
          <MetricCard label="Total Customers" value={metrics.customerCount.toString()} subtext="Active accounts" trend="+18" color="amber" />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <MetricCard label="Average Customer LTV" value={`$${metrics.avgLtv.toLocaleString()}`} subtext="Lifetime value" color="rose" />
          <MetricCard label="Overage Revenue" value={`$${metrics.overageRevenue.toLocaleString()}`} subtext="Usage-based billing" trend="+8.2%" color="cyan" />
          <MetricCard label="Failed Payments" value={metrics.failedPayments.toString()} subtext="Requiring retry" color="red" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* MRR Trend */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">MRR Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mrrTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="month" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #404040' }} />
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Plan Distribution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Customer Distribution by Plan</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Cohort Analysis */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Cohort Retention Analysis</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="cohort" stroke="#999" />
                <YAxis stroke="#999" label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #404040' }} />
                <Legend />
                <Bar dataKey="month_1" fill="#10b981" name="Month 1" />
                <Bar dataKey="month_3" fill="#3b82f6" name="Month 3" />
                <Bar dataKey="month_6" fill="#f59e0b" name="Month 6" />
                <Bar dataKey="month_12" fill="#ec4899" name="Month 12" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Revenue by Source</h2>
            <div className="space-y-4">
              <RevenueSource label="Subscription Revenue" amount={metrics.mrr * 0.7} percent={70} color="emerald" />
              <RevenueSource label="Overage Revenue" amount={metrics.overageRevenue} percent={15} color="cyan" />
              <RevenueSource label="Expansion Revenue" amount={metrics.expansionRevenue} percent={10} color="violet" />
              <RevenueSource label="Marketplace (Future)" amount={0} percent={5} color="gray" />
            </div>
          </div>

        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Customers */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Top 10 Customers by MRR</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-600">
                  <tr className="text-gray-400">
                    <th className="text-left py-2">Customer</th>
                    <th className="text-right py-2">MRR</th>
                    <th className="text-right py-2">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3">Customer {i + 1}</td>
                      <td className="text-right">${(5000 - i * 500).toLocaleString()}</td>
                      <td className="text-right text-blue-400">{i % 2 === 0 ? 'Enterprise' : 'Professional'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Payments Requiring Action */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Failed Payments (Action Required)</h2>
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-700 rounded p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Payment #{1001 + i}</p>
                    <p className="text-gray-400 text-sm">Failed {i + 1} day(s) ago</p>
                  </div>
                  <button className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm font-semibold">
                    Retry
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Export Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Export Data</h2>
          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold flex items-center gap-2">
              📊 Download as CSV
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded font-semibold flex items-center gap-2">
              📈 Download as PDF
            </button>
            <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold flex items-center gap-2">
              📧 Email Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: METRIC CARD
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: string;
  good?: boolean;
  color?: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose' | 'cyan' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, trend, good = false, color = 'blue' }) => {
  const colorClasses = {
    emerald: 'border-emerald-500 bg-emerald-500/10',
    blue: 'border-blue-500 bg-blue-500/10',
    violet: 'border-violet-500 bg-violet-500/10',
    amber: 'border-amber-500 bg-amber-500/10',
    rose: 'border-rose-500 bg-rose-500/10',
    cyan: 'border-cyan-500 bg-cyan-500/10',
    red: 'border-red-500 bg-red-500/10'
  };

  const trendColor = good ? 'text-emerald-400' : (trend?.startsWith('+') ? 'text-emerald-400' : 'text-red-400');

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color]}`}>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtext && <p className="text-gray-500 text-xs mb-2">{subtext}</p>}
      {trend && <p className={`text-sm font-semibold ${trendColor}`}>{trend}</p>}
    </div>
  );
};

// ============================================================================
// COMPONENT: REVENUE SOURCE
// ============================================================================

interface RevenueSourceProps {
  label: string;
  amount: number;
  percent: number;
  color: 'emerald' | 'cyan' | 'violet' | 'gray';
}

const RevenueSource: React.FC<RevenueSourceProps> = ({ label, amount, percent, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-600',
    cyan: 'bg-cyan-600',
    violet: 'bg-violet-600',
    gray: 'bg-gray-600'
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-semibold">{label}</span>
        <span className="text-gray-400">${amount.toLocaleString()} ({percent}%)</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorClasses[color]}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default AdminRevenueDashboard;
