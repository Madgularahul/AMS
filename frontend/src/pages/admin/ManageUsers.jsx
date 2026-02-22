import { useState, useEffect } from "react";
import api from "../../utils/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "student",
  rollNumber: "",
  department: "",
  section: ""
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchSections();
  }, [filter]);

  const fetchUsers = async () => {
    const { data } = await api.get(
      "/admin/users" + (filter ? `?role=${filter}` : "")
    );
    setUsers(data);
  };

  const fetchDepartments = async () => {
    const { data } = await api.get("/admin/departments");
    setDepartments(data);
  };

  const fetchSections = async () => {
    const { data } = await api.get("/admin/sections");
    setSections(data);
  };

  const filteredSections = sections.filter(
    (sec) => sec.department?._id === form.department
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      rollNumber: form.rollNumber,
      departmentId: form.department || null,
      sectionId: form.section || null
    };

    // Don't send password if editing and password is empty
    if (editId && !form.password) {
      delete payload.password;
    }

    try {
      if (editId) {
        await api.put(`/admin/users/${editId}`, payload);
        setMsg({ type: "success", text: "User updated successfully!" });
      } else {
        await api.post("/admin/users", payload);
        setMsg({ type: "success", text: "User created successfully!" });
      }

      setForm(emptyForm);
      setEditId(null);
      fetchUsers();
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Operation failed"
      });
    }
  };

  const handleEdit = (u) => {
    setEditId(u._id);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      rollNumber: u.rollNumber || "",
      department: u.department?._id || "",
      section: u.section?._id || ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${id}`);
    fetchUsers();
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div className="page-title" style={{ marginBottom: '0.5rem' }}>
            👥 User Management
          </div>
          <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
            Create and manage faculty and student accounts
          </p>
        </div>
      </div>

      {/* ================= FORM ================= */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>
          {editId ? '✏️ Edit User' : '➕ Add New User'}
        </h3>

        {msg.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            background: msg.type === 'success' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(198, 40, 40, 0.2)',
            border: `2px solid ${msg.type === 'success' ? 'rgba(46, 125, 50, 0.5)' : 'rgba(198, 40, 40, 0.5)'}`,
            color: 'white'
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.9)'
              }}>
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#333',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.9)'
              }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#333',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.9)'
              }}>
                Password {editId && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required={!editId}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#333',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.9)'
              }}>
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#333',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {form.role === "student" && (
              <>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    Roll Number
                  </label>
                  <input
                    value={form.rollNumber}
                    onChange={(e) =>
                      setForm({ ...form, rollNumber: e.target.value })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.95)',
                      color: '#333',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        department: e.target.value,
                        section: ""
                      })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.95)',
                      color: '#333',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.9)'
                  }}>
                    Section
                  </label>
                  <select
                    value={form.section}
                    onChange={(e) =>
                      setForm({ ...form, section: e.target.value })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.95)',
                      color: '#333',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Section</option>
                    {filteredSections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.sectionName} - Year {s.year} Sem {s.semester}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: '#667eea',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              {editId ? '✓ Update User' : '+ Create User'}
            </button>
            {editId && (
              <button 
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm);
                  setMsg({ type: '', text: '' });
                }}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255,255,255,0.5)',
                  background: 'transparent',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>📋 All Users ({users.length})</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            <option value="">All Roles</option>
            <option value="faculty">Faculty Only</option>
            <option value="student">Students Only</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: '100px' }}>Role</th>
                <th style={{ width: '120px' }}>Roll No</th>
                <th>Department</th>
                <th>Section</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    No users found. Create your first user above.
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u._id} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ textAlign: 'center', color: '#999', fontWeight: '600' }}>{i + 1}</td>
                    <td style={{ fontWeight: '500' }}>{u.name}</td>
                    <td style={{ color: '#666' }}>{u.email}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: u.role === 'faculty' ? '#e3f2fd' : '#f3e5f5',
                        color: u.role === 'faculty' ? '#1565c0' : '#6a1b9a'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{u.rollNumber || "-"}</td>
                    <td>{u.department?.name || "-"}</td>
                    <td>{u.section?.sectionName || "-"}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-small"
                          onClick={() => handleEdit(u)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#1a237e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn btn-small"
                          onClick={() => handleDelete(u._id)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#c62828',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}