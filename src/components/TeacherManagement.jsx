import React, { useState, useEffect } from 'react';

function TeacherManagement() {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Teacher'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await window.electronAPI.dbQuery("SELECT Id, Name, Email, Role, IsActive FROM Users WHERE Role != 'SuperAdmin'");
        if (res.success) {
            setUsers(res.data);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            return alert('Please fill all fields');
        }

        setLoading(true);
        try {
            const hashedPassword = await window.electronAPI.hashPassword(formData.password);
            const query = "INSERT INTO Users (Name, Email, PasswordHash, Role) VALUES (?, ?, ?, ?)";
            const res = await window.electronAPI.dbQuery(query, [formData.name, formData.email, hashedPassword, formData.role]);

            if (res.success) {
                alert('User added successfully!');
                setFormData({ name: '', email: '', password: '', role: 'Teacher' });
                fetchUsers();
            } else {
                alert('Error adding teacher: ' + res.error);
            }
        } catch (error) {
            alert('Operation failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus ? 0 : 1;
        const res = await window.electronAPI.dbQuery("UPDATE Users SET IsActive = ? WHERE Id = ?", [newStatus, id]);
        if (res.success) {
            // Refresh the current staff list after status change
            fetchUsers();
        }
    };

    return (
        <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2>Staff Management</h2>

            <form onSubmit={handleAddUser} style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#9ca3af' }}>Full Name</label>
                    <input
                        className="input-field"
                        style={{ marginBottom: 0, pointerEvents: 'auto' }}
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                        tabIndex="1"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#9ca3af' }}>Email Address</label>
                    <input
                        className="input-field"
                        style={{ marginBottom: 0, pointerEvents: 'auto' }}
                        type="email"
                        placeholder="teacher@school.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        tabIndex="2"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#9ca3af' }}>Role</label>
                    <select
                        className="input-field"
                        style={{ marginBottom: 0, pointerEvents: 'auto' }}
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        tabIndex="4"
                    >
                        <option value="Teacher">Teacher</option>
                        <option value="Principal">Principal</option>
                        <option value="Accountant">Accountant</option>
                    </select>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ height: '45px', padding: '0 1.5rem', pointerEvents: 'auto' }} tabIndex="5">
                    {loading ? 'Adding...' : 'Add User'}
                </button>
            </form>

            <div style={{ marginTop: '3rem' }}>
                <h3>Active Staff ({users.length})</h3>
                <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.Id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{user.Name}</td>
                                    <td style={{ padding: '1rem' }}>{user.Email}</td>
                                    <td style={{ padding: '1rem' }}>{user.Role}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.8rem',
                                            background: user.IsActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: user.IsActive ? '#10b981' : '#ef4444'
                                        }}>
                                            {user.IsActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => toggleStatus(user.Id, user.IsActive)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#9ca3af',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {user.IsActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default TeacherManagement;
