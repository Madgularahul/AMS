import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Settings() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetForm, setResetForm] = useState({
    email: '',
    newPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleResetChange = (e) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
    setResetMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      setMessage({ type: 'success', text: data.message });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetMessage({ type: '', text: '' });

    if (resetForm.newPassword.length < 6) {
      setResetMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setResetLoading(true);
    try {
      const { data } = await api.post('/admin/reset-user-password', {
        email: resetForm.email,
        newPassword: resetForm.newPassword
      });
      
      setResetMessage({ type: 'success', text: data.message });
      setResetForm({ email: '', newPassword: '' });
    } catch (error) {
      setResetMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to reset password' 
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102,126,234,0.2)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          ⚙️ Account Settings
        </div>
        <div style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '0.5rem' }}>
          Manage your account preferences and security
        </div>
      </div>

      {/* User Info Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          marginBottom: '1.5rem', 
          color: '#667eea', 
          fontSize: '1.2rem',
          borderBottom: '2px solid #e8eaf6',
          paddingBottom: '0.75rem'
        }}>
          👤 Profile Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Name</label>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem' }}>{user?.name}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Email</label>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem' }}>{user?.email}</div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Role</label>
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`badge badge-${user?.role}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          marginBottom: '1.5rem', 
          color: '#667eea', 
          fontSize: '1.2rem',
          borderBottom: '2px solid #e8eaf6',
          paddingBottom: '0.75rem'
        }}>
          🔒 Change Password
        </h3>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ maxWidth: '500px' }}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleChange}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                required
                placeholder="Enter new password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm new password"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Changing Password...' : '🔐 Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
