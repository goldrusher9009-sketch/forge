/**
 * Forge Admin Dashboard
 *
 * Features:
 * - Customer management
 * - Subscription tracking
 * - Usage analytics
 * - Financial reporting
 * - Support ticket management
 */

import React, { useState, useEffect } from 'react';
import './admin-dashboard.css';

// ============================================================================
// ADMIN DASHBOARD MAIN
// ============================================================================

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="admin-loading">Loading dashboard...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Forge Admin Dashboard</h1>
                <div className="admin-header-actions">
                    <button className="btn-secondary" onClick={fetchDashboardData}>
                        Refresh
                    </button>
                    <div className="admin-user">
                        <span>Admin</span>
                        <div className="user-avatar">A</div>
                    </div>
                </div>
            </header>

            <nav className="admin-nav">
                {['overview', 'customers', 'subscriptions', 'analytics', 'support', 'settings'].map(
                    (tab) => (
                        <button
                            key={tab}
                            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    )
                )}
            </nav>

            <main className="admin-content">
                {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
                {activeTab === 'customers' && <CustomersTab />}
                {activeTab === 'subscriptions' && <SubscriptionsTab />}
                {activeTab === 'analytics' && <AnalyticsTab />}
                {activeTab === 'support' && <SupportTab />}
                {activeTab === 'settings' && <SettingsTab />}
            </main>
        </div>
    );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ data }) {
    return (
        <div className="admin-section">
            <h2>Dashboard Overview</h2>

            <div className="kpi-grid">
                <KPICard
                    title="Total Customers"
                    value={data.totalCustomers || 0}
                    change="+12%"
                    icon="👥"
                />
                <KPICard
                    title="Active Subscriptions"
                    value={data.activeSubscriptions || 0}
                    change="+8%"
                    icon="📋"
                />
                <KPICard
                    title="Monthly Recurring Revenue"
                    value={`$${(data.mrr || 0).toLocaleString()}`}
                    change="+15%"
                    icon="💰"
                />
                <KPICard
                    title="Churn Rate"
                    value={`${(data.churnRate || 0).toFixed(2)}%`}
                    change="-2%"
                    icon="📊"
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Revenue Trend (Last 30 Days)</h3>
                    <RevenueChart data={data.revenueData || []} />
                </div>
                <div className="chart-card">
                    <h3>Subscription Breakdown</h3>
                    <SubscriptionChart data={data.subscriptionBreakdown || {}} />
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <RecentActivityList activities={data.recentActivities || []} />
            </div>
        </div>
    );
}

// ============================================================================
// CUSTOMERS TAB
// ============================================================================

function CustomersTab() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/admin/customers', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setCustomers(data.customers);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers
        .filter((c) => c.email.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'createdAt') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });

    return (
        <div className="admin-section">
            <h2>Customer Management</h2>

            <div className="section-toolbar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-dropdown">
                    <option value="createdAt">Newest First</option>
                    <option value="name">Name (A-Z)</option>
                </select>
                <button className="btn-secondary" onClick={fetchCustomers}>
                    Refresh
                </button>
            </div>

            {selectedCustomer ? (
                <CustomerDetail
                    customer={selectedCustomer}
                    onBack={() => setSelectedCustomer(null)}
                />
            ) : (
                <table className="customers-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.email}</td>
                                <td>{customer.companyName || '-'}</td>
                                <td>{customer.plan}</td>
                                <td>
                                    <span className={`status-badge status-${customer.status}`}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-small"
                                        onClick={() => setSelectedCustomer(customer)}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function CustomerDetail({ customer, onBack }) {
    return (
        <div className="customer-detail">
            <button className="btn-secondary" onClick={onBack}>
                ← Back to Customers
            </button>

            <div className="detail-grid">
                <div className="detail-section">
                    <h3>Customer Information</h3>
                    <p><strong>Email:</strong> {customer.email}</p>
                    <p><strong>Name:</strong> {customer.name}</p>
                    <p><strong>Company:</strong> {customer.companyName || '-'}</p>
                    <p><strong>Industry:</strong> {customer.industry || '-'}</p>
                    <p><strong>Joined:</strong> {new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="detail-section">
                    <h3>Subscription</h3>
                    <p><strong>Plan:</strong> {customer.plan}</p>
                    <p><strong>Status:</strong> {customer.subscriptionStatus}</p>
                    <p><strong>Monthly Cost:</strong> ${customer.monthlyCost}</p>
                    <p><strong>Next Billing:</strong> {new Date(customer.nextBillingDate).toLocaleDateString()}</p>
                </div>

                <div className="detail-section">
                    <h3>Usage</h3>
                    <p><strong>Team Members:</strong> {customer.teamMembers}/{customer.teamLimit}</p>
                    <p><strong>Storage Used:</strong> {customer.storageUsed}GB / {customer.storageLimit}GB</p>
                    <p><strong>API Calls:</strong> {(customer.apiCalls || 0).toLocaleString()}</p>
                </div>
            </div>

            <div className="detail-actions">
                <button className="btn-secondary">Send Email</button>
                <button className="btn-danger">Cancel Subscription</button>
            </div>
        </div>
    );
}

// ============================================================================
// SUBSCRIPTIONS TAB
// ============================================================================

function SubscriptionsTab() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchSubscriptions();
    }, [filter]);

    const fetchSubscriptions = async () => {
        try {
            const response = await fetch(`/api/admin/subscriptions?status=${filter}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setSubscriptions(data.subscriptions);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        }
    };

    return (
        <div className="admin-section">
            <h2>Subscription Management</h2>

            <div className="filter-buttons">
                {['all', 'active', 'trialing', 'past_due', 'canceled'].map((status) => (
                    <button
                        key={status}
                        className={`filter-btn ${filter === status ? 'active' : ''}`}
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            <table className="subscriptions-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Monthly Cost</th>
                        <th>Started</th>
                        <th>Next Billing</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {subscriptions.map((sub) => (
                        <tr key={sub.id}>
                            <td>{sub.customerEmail}</td>
                            <td>{sub.planName}</td>
                            <td>
                                <span className={`status-badge status-${sub.status}`}>
                                    {sub.status}
                                </span>
                            </td>
                            <td>${sub.monthlyCost}</td>
                            <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                            <td>{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                            <td>
                                <button className="btn-small">Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================

function AnalyticsTab() {
    return (
        <div className="admin-section">
            <h2>Analytics & Reporting</h2>

            <div className="analytics-grid">
                <div className="analytics-card">
                    <h3>Key Metrics</h3>
                    <ul>
                        <li>Daily Active Users: 1,234</li>
                        <li>Average Session Duration: 24 min</li>
                        <li>Feature Adoption: 67%</li>
                        <li>User Retention (30-day): 78%</li>
                    </ul>
                </div>

                <div className="analytics-card">
                    <h3>Signups (Last 7 Days)</h3>
                    <div className="mini-chart">
                        <div className="bar" style={{ height: '60%' }}></div>
                        <div className="bar" style={{ height: '75%' }}></div>
                        <div className="bar" style={{ height: '90%' }}></div>
                        <div className="bar" style={{ height: '100%' }}></div>
                        <div className="bar" style={{ height: '85%' }}></div>
                        <div className="bar" style={{ height: '70%' }}></div>
                        <div className="bar" style={{ height: '80%' }}></div>
                    </div>
                </div>

                <div className="analytics-card">
                    <h3>Revenue by Plan</h3>
                    <ul>
                        <li>Professional: $12,450 (72%)</li>
                        <li>Enterprise: $4,800 (28%)</li>
                        <li>Free: $0</li>
                    </ul>
                </div>
            </div>

            <div className="export-section">
                <h3>Export Reports</h3>
                <button className="btn-secondary">Export CSV</button>
                <button className="btn-secondary">Export PDF</button>
            </div>
        </div>
    );
}

// ============================================================================
// SUPPORT TAB
// ============================================================================

function SupportTab() {
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await fetch('/api/admin/support-tickets', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setTickets(data.tickets);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        }
    };

    return (
        <div className="admin-section">
            <h2>Support Tickets</h2>

            <table className="support-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Subject</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((ticket) => (
                        <tr key={ticket.id}>
                            <td>#{ticket.id}</td>
                            <td>{ticket.customerEmail}</td>
                            <td>{ticket.subject}</td>
                            <td>
                                <span className={`priority-badge priority-${ticket.priority}`}>
                                    {ticket.priority}
                                </span>
                            </td>
                            <td>
                                <span className={`status-badge status-${ticket.status}`}>
                                    {ticket.status}
                                </span>
                            </td>
                            <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button className="btn-small">Reply</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

function SettingsTab() {
    return (
        <div className="admin-section">
            <h2>Admin Settings</h2>

            <div className="settings-form">
                <div className="settings-section">
                    <h3>System Configuration</h3>
                    <label>
                        <input type="checkbox" defaultChecked /> Maintenance Mode
                    </label>
                    <label>
                        <input type="checkbox" defaultChecked /> Email Notifications
                    </label>
                    <label>
                        <input type="checkbox" /> Require 2FA
                    </label>
                </div>

                <div className="settings-section">
                    <h3>Backup & Recovery</h3>
                    <button className="btn-secondary">Create Database Backup</button>
                    <p className="text-muted">Last backup: 2 hours ago</p>
                </div>

                <div className="settings-section">
                    <h3>API Keys</h3>
                    <div className="api-key-box">
                        <code>sk_live_xxxxxxxxxxxxxxxxxxxx</code>
                        <button className="btn-small">Rotate</button>
                    </div>
                </div>

                <button className="btn-primary">Save Settings</button>
            </div>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function KPICard({ title, value, change, icon }) {
    const isPositive = change.startsWith('+');
    return (
        <div className="kpi-card">
            <div className="kpi-icon">{icon}</div>
            <h4>{title}</h4>
            <p className="kpi-value">{value}</p>
            <p className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
                {change} from last month
            </p>
        </div>
    );
}

function RevenueChart({ data }) {
    return (
        <div className="mini-chart">
            {/* Placeholder for Chart.js or similar */}
            <p>Revenue chart visualization</p>
        </div>
    );
}

function SubscriptionChart({ data }) {
    return (
        <div className="mini-chart">
            {/* Placeholder for pie chart */}
            <p>Subscription breakdown</p>
        </div>
    );
}

function RecentActivityList({ activities }) {
    return (
        <ul className="activity-list">
            {activities.map((activity, i) => (
                <li key={i}>
                    <strong>{activity.action}</strong> - {activity.description}
                    <span className="activity-time">{activity.time}</span>
                </li>
            ))}
        </ul>
    );
}

export default AdminDashboard;
