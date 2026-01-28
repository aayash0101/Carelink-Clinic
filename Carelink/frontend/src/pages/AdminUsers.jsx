import { useState, useEffect } from 'react'
import api from '../services/api' // 🛡️ SECURE IMPORT
import { toast } from 'react-toastify'
import { ADMIN_USERS } from '../services/endpoints'
import './AdminUsers.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // 🛡️ Uses secure api instance
      const { data } = await api.get(ADMIN_USERS)
      setUsers(data.data.users)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Note: Backend 'update user status' endpoint wasn't in the provided backend code,
  // so this button is visual for now or can be extended later.
  const toggleUserStatus = (userId) => {
    toast.info('User management features coming soon')
  }

  if (loading) {
    return <div className="loading">Loading users...</div>
  }

  return (
    <div className="admin-users">
      <h2>User Management</h2>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Email Verified</th>
              <th>2FA Enabled</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {user.isEmailVerified ? (
                    <span className="verified-badge" style={{color: 'green'}}>✓ Verified</span>
                  ) : (
                    <span className="unverified-badge" style={{color: 'orange'}}>✗ Unverified</span>
                  )}
                </td>
                <td>
                  {user.twoFactorEnabled ? (
                    <span className="enabled-badge" style={{color: 'green'}}>✓ Enabled</span>
                  ) : (
                    <span className="disabled-badge" style={{color: '#888'}}>✗ Disabled</span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn-view" onClick={() => toggleUserStatus(user._id)}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsers

