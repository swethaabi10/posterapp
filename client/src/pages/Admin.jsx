import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Admin = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('stats'); // stats, users, payments
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const statsRes = await api.get('/admin/stats');
      const usersRes = await api.get('/admin/users');
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      // Fetch payments too
      const paymentsRes = await api.get('/admin/payments');
      setPayments(paymentsRes.data.users);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setSuccessMsg(data.message || 'User role updated successfully.');
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      // Refresh stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error changing user role:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApprovePayment = async (userId) => {
    setUpdatingPaymentId(userId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.post(`/admin/payments/${userId}/approve`);
      setSuccessMsg(data.message || 'Payment approved successfully.');
      // Update local state
      setPayments(prev => prev.map(p => p._id === userId ? { ...p, paymentStatus: 'approved' } : p));
      // Refresh user stats in registry
      fetchData();
    } catch (err) {
      console.error('Error approving payment:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleRejectPayment = async (userId) => {
    setUpdatingPaymentId(userId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const { data } = await api.post(`/admin/payments/${userId}/reject`);
      setSuccessMsg(data.message || 'Payment verification rejected.');
      // Update local state
      setPayments(prev => prev.map(p => p._id === userId ? { ...p, paymentStatus: 'none', paymentTxnId: '' } : p));
      // Refresh user stats in registry
      fetchData();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Filters
  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.shopName && u.shopName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPayments = payments.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.paymentTxnId && u.paymentTxnId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 1. Process Category Stats for Donut Chart
  const categories = stats?.categoryStats || [];
  const categoryTotal = categories.reduce((sum, c) => sum + c.count, 0);
  const colors = ['#d4a017', '#10b981', '#ef4444', '#ca8a04', '#a855f7', '#60a5fa', '#f59e0b', '#3b82f6'];

  let donutAccumulator = 0;
  const donutSlices = categories.map((cat, idx) => {
    const percentage = categoryTotal > 0 ? (cat.count / categoryTotal) * 100 : 0;
    const length = 314.16 * (percentage / 100);
    const offset = 314.16 - length + donutAccumulator;
    donutAccumulator -= length; // Accumulate negative for clockwise rotation
    return {
      name: cat._id || 'Unknown',
      count: cat.count,
      percentage: percentage.toFixed(1),
      offset,
      length,
      color: colors[idx % colors.length]
    };
  });

  // 2. Process Daily Stats for Bar Chart (7 Days)
  const rawDaily = stats?.dailyStats || [];
  const dailyMap = {};
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = { date: dateStr, save: 0, share: 0 };
  }

  // Populate from raw statistics
  rawDaily.forEach(item => {
    const date = item._id.date;
    const action = item._id.action;
    if (dailyMap[date]) {
      dailyMap[date][action] = item.count;
    }
  });

  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  const maxDailyCount = Math.max(...dailyData.map(d => Math.max(d.save, d.share)), 5); // scale threshold

  return (
    <div className="main-content page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="page-header animate-fadeInUp" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.8rem', color: 'var(--white)', margin: 0 }}>🛡️ Admin Dashboard</h1>
            <p className="page-subtitle" style={{ fontSize: '0.9rem', color: 'var(--white-50)', marginTop: '4px' }}>System analytics, user activity, privileges, and payments</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchData}>🔄 Refresh Data</button>
        </div>
        <div className="gold-divider" style={{ height: '2px', background: 'var(--gold-gradient)', width: '60px', marginTop: '16px' }} />
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="alert alert-success animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>✅</span><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error animate-fadeIn" style={{ marginBottom: '20px' }}>
          <span>⚠️</span><span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--white-10)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => { setActiveTab('stats'); setSearchQuery(''); }}
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px' }}
        >
          📊 System Overview
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px' }}
        >
          👥 User Privilege Roles
        </button>
        <button 
          onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
          className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px' }}
        >
          💳 Payments Verification
        </button>
      </div>

      {/* CONDITIONAL RENDER: STATS TAB */}
      {activeTab === 'stats' && (
        <>
          {/* KPI Stats Grid */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }} className="animate-fadeInUp">
              <div className="stat-card" style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)' }}>
                <div className="stat-card-icon" style={{ background: 'rgba(212, 160, 23, 0.15)', color: 'var(--gold-400)' }}>👥</div>
                <div>
                  <div className="stat-card-label" style={{ color: 'var(--white-50)' }}>Total Registered Users</div>
                  <div className="stat-card-value" style={{ fontSize: '1.8rem', color: 'var(--white)' }}>{stats.totalUsers}</div>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)' }}>
                <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>💾</div>
                <div>
                  <div className="stat-card-label" style={{ color: 'var(--white-50)' }}>Total Posters Saved</div>
                  <div className="stat-card-value" style={{ fontSize: '1.8rem', color: 'var(--white)' }}>{stats.totalSaves}</div>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)' }}>
                <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>📱</div>
                <div>
                  <div className="stat-card-label" style={{ color: 'var(--white-50)' }}>Total Posters Shared</div>
                  <div className="stat-card-value" style={{ fontSize: '1.8rem', color: 'var(--white)' }}>{stats.totalShares}</div>
                </div>
              </div>
              <div className="stat-card" style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)' }}>
                <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>⚡</div>
                <div>
                  <div className="stat-card-label" style={{ color: 'var(--white-50)' }}>Active Users (Last 7 Days)</div>
                  <div className="stat-card-value" style={{ fontSize: '1.8rem', color: 'var(--white)' }}>{stats.totalActiveUsers}</div>
                </div>
              </div>
            </div>
          )}

          {/* Visualizations Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }} className="animate-fadeInUp">
            
            {/* Donut Chart: Template Category Distribution */}
            <div style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)', padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--white)', margin: '0 0 4px 0', fontSize: '1.1rem' }}>🖼️ Template Category Distribution</h3>
              <p style={{ color: 'var(--white-50)', margin: '0 0 24px 0', fontSize: '0.8rem' }}>Aggregated save & share counts by category</p>
              
              {categoryTotal === 0 ? (
                <div style={{ height: '220px', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--white-30)' }}>
                  No template activity logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--white-10)" strokeWidth="12" />
                      {donutSlices.map((slice, idx) => (
                        <circle 
                          key={idx}
                          cx="60" 
                          cy="60" 
                          r="50" 
                          fill="none" 
                          stroke={slice.color} 
                          strokeWidth="12" 
                          strokeDasharray="314.16" 
                          strokeDashoffset={slice.offset} 
                          transform="rotate(-90 60 60)" 
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      ))}
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--white)' }}>{categoryTotal}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--white-50)', textTransform: 'uppercase' }}>Actions</div>
                    </div>
                  </div>

                  {/* Legends */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                    {donutSlices.map((slice, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: slice.color }} />
                          <span style={{ color: 'var(--white-80)', textTransform: 'capitalize' }}>{slice.name}</span>
                        </div>
                        <span style={{ color: 'var(--white-50)', marginLeft: '12px' }}>
                          <strong>{slice.count}</strong> ({slice.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Chart: Daily Activity saves vs shares */}
            <div style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)', padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--white)', margin: '0 0 4px 0', fontSize: '1.1rem' }}>📈 Daily Activity Timeline</h3>
              <p style={{ color: 'var(--white-50)', margin: '0 0 24px 0', fontSize: '0.8rem' }}>Saves and shares over the last 7 days</p>

              <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                    const yPos = 180 - val * 150;
                    return (
                      <g key={idx}>
                        <line x1="40" y1={yPos} x2="98%" y2={yPos} stroke="var(--white-10)" strokeWidth="1" strokeDasharray="4" />
                        <text x="30" y={yPos + 4} fill="var(--white-40)" fontSize="10" textAnchor="end">
                          {Math.round(val * maxDailyCount)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {dailyData.map((day, idx) => {
                    const xCenter = 40 + (idx + 0.5) * (90 / dailyData.length) * 4.2;
                    
                    const saveHeight = (day.save / maxDailyCount) * 150;
                    const shareHeight = (day.share / maxDailyCount) * 150;
                    
                    const saveY = 180 - saveHeight;
                    const shareY = 180 - shareHeight;

                    const dateObj = new Date(day.date);
                    const label = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                    return (
                      <g key={idx}>
                        <rect 
                          x={xCenter - 10} 
                          y={saveY} 
                          width="8" 
                          height={saveHeight} 
                          fill="#10b981" 
                          rx="2"
                          style={{ transition: 'all 0.5s ease' }}
                        >
                          <title>{`Saves: ${day.save}`}</title>
                        </rect>
                        <rect 
                          x={xCenter + 2} 
                          y={shareY} 
                          width="8" 
                          height={shareHeight} 
                          fill="var(--gold-500)" 
                          rx="2"
                          style={{ transition: 'all 0.5s ease' }}
                        >
                          <title>{`Shares: ${day.share}`}</title>
                        </rect>
                        <text x={xCenter - 4} y="200" fill="var(--white-50)" fontSize="10" textAnchor="middle">
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
                  <span style={{ color: 'var(--white-80)' }}>Saves (Downloads)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: 'var(--gold-500)' }} />
                  <span style={{ color: 'var(--white-80)' }}>Shares (WhatsApp)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CONDITIONAL RENDER: USERS TAB */}
      {activeTab === 'users' && (
        <div style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)', borderRadius: '12px', padding: '24px' }} className="animate-fadeInUp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ color: 'var(--white)', margin: '0', fontSize: '1.25rem' }}>👥 User Privilege Management</h2>
              <p style={{ color: 'var(--white-50)', margin: '4px 0 0 0', fontSize: '0.8rem' }}>Assign roles, promote administrators, and audit user activity stats</p>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search name, email, or shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '12px', height: '40px', background: 'var(--navy-900)', border: '1px solid var(--white-10)' }}
              />
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--white-10)', color: 'var(--gold-400)' }}>
                  <th style={{ padding: '12px 16px' }}>Registered Owner</th>
                  <th style={{ padding: '12px 16px' }}>Email Address</th>
                  <th style={{ padding: '12px 16px' }}>Shop Name</th>
                  <th style={{ padding: '12px 16px' }}>Phone Number</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Saves 💾</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Shares 📱</th>
                  <th style={{ padding: '12px 16px' }}>Joined Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Role Access</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--white-30)' }}>
                      No users match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isPending = updatingUserId === u._id;
                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--white-05)', color: 'var(--white-80)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{u.name}</td>
                        <td style={{ padding: '14px 16px' }}>{u.email}</td>
                        <td style={{ padding: '14px 16px' }}>{u.shopName || <span style={{ color: 'var(--white-30)' }}>—</span>}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {u.shopPhone ? (
                            <>
                              <div>{u.shopPhone}</div>
                              {u.whatsappNumber && u.whatsappNumber !== u.shopPhone && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--gold-400)', marginTop: '2px' }}>
                                  💬 {u.whatsappNumber}
                                </div>
                              )}
                            </>
                          ) : (
                            u.whatsappNumber ? (
                              <div style={{ color: 'var(--gold-400)' }}>💬 {u.whatsappNumber}</div>
                            ) : (
                              <span style={{ color: 'var(--white-30)' }}>—</span>
                            )
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{u.savesCount}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 'bold', color: 'var(--gold-400)' }}>{u.sharesCount}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            disabled={isPending}
                            className="form-control"
                            style={{
                              height: '32px',
                              width: '95px',
                              background: u.role === 'admin' ? 'rgba(212, 160, 23, 0.15)' : 'var(--navy-900)',
                              color: u.role === 'admin' ? 'var(--gold-400)' : 'var(--white-80)',
                              border: u.role === 'admin' ? '1px solid var(--gold-500)' : '1px solid var(--white-10)',
                              padding: '0 8px',
                              fontSize: '0.8rem',
                              fontWeight: u.role === 'admin' ? 'bold' : 'normal',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin 🛡️</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div style={{ background: 'var(--navy-800)', border: '1px solid var(--white-10)', borderRadius: '12px', padding: '24px' }} className="animate-fadeInUp">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ color: 'var(--white)', margin: '0', fontSize: '1.25rem' }}>💳 Subscriptions & Payments</h2>
              <p style={{ color: 'var(--white-50)', margin: '4px 0 0 0', fontSize: '0.8rem' }}>Review submitted Transaction Reference codes (UTR) and verify account permits</p>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search name, email, or UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '12px', height: '40px', background: 'var(--navy-900)', border: '1px solid var(--white-10)' }}
              />
            </div>
          </div>

           {/* Payments Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--white-10)', color: 'var(--gold-400)' }}>
                  <th style={{ padding: '12px 16px' }}>User Name</th>
                  <th style={{ padding: '12px 16px' }}>Email Address</th>
                  <th style={{ padding: '12px 16px' }}>Shop Name</th>
                  <th style={{ padding: '12px 16px' }}>Phone Number</th>
                  <th style={{ padding: '12px 16px' }}>UTR / Reference Code</th>
                  <th style={{ padding: '12px 16px' }}>Date Submitted</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Verification Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--white-30)' }}>
                      No subscription records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isPendingAction = updatingPaymentId === p._id;
                    
                    let statusColor = 'var(--white-40)';
                    let statusBg = 'rgba(255,255,255,0.05)';
                    if (p.paymentStatus === 'approved') {
                      statusColor = '#10b981';
                      statusBg = 'rgba(16, 185, 129, 0.15)';
                    } else if (p.paymentStatus === 'pending') {
                      statusColor = 'var(--gold-400)';
                      statusBg = 'rgba(212, 160, 23, 0.15)';
                    }

                    return (
                      <tr key={p._id} style={{ borderBottom: '1px solid var(--white-05)', color: 'var(--white-80)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{p.name}</td>
                        <td style={{ padding: '14px 16px' }}>{p.email}</td>
                        <td style={{ padding: '14px 16px' }}>{p.shopName || <span style={{ color: 'var(--white-30)' }}>—</span>}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {p.shopPhone ? (
                            <>
                              <div>{p.shopPhone}</div>
                              {p.whatsappNumber && p.whatsappNumber !== p.shopPhone && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--gold-400)', marginTop: '2px' }}>
                                  💬 {p.whatsappNumber}
                                </div>
                              )}
                            </>
                          ) : (
                            p.whatsappNumber ? (
                              <div style={{ color: 'var(--gold-400)' }}>💬 {p.whatsappNumber}</div>
                            ) : (
                              <span style={{ color: 'var(--white-30)' }}>—</span>
                            )
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', letterSpacing: '0.05em', color: p.paymentTxnId ? 'var(--white)' : 'var(--white-30)' }}>
                          {p.paymentTxnId || 'No txn submitted'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          {p.paymentDate ? (
                            new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          ) : (
                            <span style={{ color: 'var(--white-30)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: statusColor,
                            background: statusBg,
                            textTransform: 'uppercase',
                            display: 'inline-block'
                          }}>
                            {p.paymentStatus || 'none'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {p.paymentStatus === 'pending' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleApprovePayment(p._id)}
                                disabled={isPendingAction}
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', background: '#10b981', borderColor: '#10b981', color: '#ffffff' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p._id)}
                                disabled={isPendingAction}
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', borderColor: '#ef4444', color: '#ef4444' }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {p.paymentStatus === 'approved' && (
                            <button
                              onClick={() => handleRejectPayment(p._id)}
                              disabled={isPendingAction}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', borderColor: 'var(--white-20)', color: 'var(--white-50)' }}
                            >
                              Revoke Access
                            </button>
                          )}
                          {p.paymentStatus === 'none' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--white-30)' }}>Awaiting Submission</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
