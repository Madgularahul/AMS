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
  const [subjectFilters, setSubjectFilters] = useState({ department: '', year: '', semester: '', section: '' });

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

  const availableFaculty = faculty.filter(
    (f) => !form.departmentId || f.department?._id === form.departmentId
  );

  // Sections available for the filter bar (scoped to filter dept)
  const filterSections = sections.filter(
    (sec) => !subjectFilters.department || sec.department?._id === subjectFilters.department
  );

  // Apply table filters
  const visibleSubjects = subjects.filter((s) => {
    if (subjectFilters.department && s.department?._id !== subjectFilters.department) return false;
    if (subjectFilters.year && String(s.year) !== subjectFilters.year) return false;
    if (subjectFilters.semester && String(s.semester) !== subjectFilters.semester) return false;
    if (subjectFilters.section && s.section?._id !== subjectFilters.section) return false;
    return true;
  });

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
              <select 
                value={form.departmentId} 
                onChange={(e) => {
                  const newDeptId = e.target.value;
                  setForm(prev => {
                    const currentFaculty = faculty.find(f => f._id === prev.assignedFaculty);
                    const resetFaculty = prev.assignedFaculty && currentFaculty?.department?._id !== newDeptId;
                    return { ...prev, departmentId: newDeptId, sectionId: '', assignedFaculty: resetFaculty ? '' : prev.assignedFaculty };
                  });
                }} 
                required
              >
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
                {availableFaculty.map((f) => (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>📚 All Subjects ({visibleSubjects.length})</h3>
        </div>

        {/* Filter Bank */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Department</label>
            <select
              value={subjectFilters.department}
              onChange={(e) => setSubjectFilters({ ...subjectFilters, department: e.target.value, section: '' })}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '110px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Year</label>
            <select
              value={subjectFilters.year}
              onChange={(e) => setSubjectFilters({ ...subjectFilters, year: e.target.value })}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '120px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Semester</label>
            <select
              value={subjectFilters.semester}
              onChange={(e) => setSubjectFilters({ ...subjectFilters, semester: e.target.value })}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '140px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Section</label>
            <select
              value={subjectFilters.section}
              onChange={(e) => setSubjectFilters({ ...subjectFilters, section: e.target.value })}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
            >
              <option value="">All Sections</option>
              {filterSections.map(s => (
                <option key={s._id} value={s._id}>{s.sectionName} (Y{s.year} S{s.semester})</option>
              ))}
            </select>
          </div>

          {(subjectFilters.department || subjectFilters.year || subjectFilters.semester || subjectFilters.section) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => setSubjectFilters({ department: '', year: '', semester: '', section: '' })}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '0.85rem', color: '#555' }}
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
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
              {visibleSubjects.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#aaa' }}>No subjects match the current filters</td></tr>
              )}
              {visibleSubjects.map((s, i) => (
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