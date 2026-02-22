import { useState, useEffect } from 'react';
import api from '../../utils/api';

const emptyForm = { name: '', code: '', departmentId: '', year: '', semester: '', sectionId: '', assignedFaculty: '' };

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const [sRes, fRes, dRes, secRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/users?role=faculty'),
        api.get('/admin/departments'),
        api.get('/admin/sections'),
      ]);
      setSubjects(sRes.data);
      setFaculty(fRes.data);
      setDepartments(dRes.data);
      setSections(secRes.data);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to load data' });
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSections = sections.filter(
    (sec) => sec.department?._id === form.departmentId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const payload = {
        name: form.name,
        code: form.code,
        departmentId: form.departmentId,
        year: parseInt(form.year),
        semester: parseInt(form.semester),
        sectionId: form.sectionId,
        facultyId: form.assignedFaculty || null
      };
      if (editId) {
        await api.put(`/admin/subjects/${editId}`, payload);
        setMsg({ type: 'success', text: 'Subject updated!' });
      } else {
        await api.post('/admin/subjects', payload);
        setMsg({ type: 'success', text: 'Subject created!' });
      }
      setForm(emptyForm);
      setEditId(null);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Operation failed' });
    }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setForm({
      name: s.name,
      code: s.code,
      departmentId: s.department?._id || '',
      year: s.year || '',
      semester: s.semester || '',
      sectionId: s.section?._id || '',
      assignedFaculty: s.assignedFaculty?._id || ''
    });
    setMsg({ type: '', text: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      setMsg({ type: 'success', text: 'Subject deleted.' });
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: 'Delete failed' });
    }
  };

  return (
    <div>
      <div className="page-title">Manage Subjects</div>

      <div className="card">
        <h3>{editId ? 'Edit Subject' : 'Add New Subject'}</h3>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Subject Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Mathematics" />
            </div>
            <div className="form-group">
              <label>Subject Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="MATH101" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value, sectionId: '' })} required>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input type="number" min="1" max="4" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required placeholder="1" />
            </div>
            <div className="form-group">
              <label>Semester</label>
              <input type="number" min="1" max="8" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} required placeholder="1" />
            </div>
            <div className="form-group">
              <label>Section</label>
              <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required disabled={!form.departmentId}>
                <option value="">Select Section</option>
                {filteredSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.sectionName} - Year {s.year} Sem {s.semester}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assign Faculty (optional)</label>
              <select value={form.assignedFaculty} onChange={(e) => setForm({ ...form, assignedFaculty: e.target.value })}>
                <option value="">-- Unassigned --</option>
                {faculty.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'} Subject</button>
            {editId && (
              <button type="button" className="btn" style={{ background: '#eee' }} onClick={() => { setEditId(null); setForm(emptyForm); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>All Subjects</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Department</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Section</th>
                <th>Assigned Faculty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#aaa' }}>No subjects found</td></tr>
              )}
              {subjects.map((s, i) => (
                <tr key={s._id}>
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.department?.name || '-'}</td>
                  <td>{s.year || '-'}</td>
                  <td>{s.semester || '-'}</td>
                  <td>{s.section?.sectionName || '-'}</td>
                  <td>{s.assignedFaculty ? s.assignedFaculty.name : <em style={{ color: '#aaa' }}>Unassigned</em>}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleEdit(s)} style={{ marginRight: '0.4rem' }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
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