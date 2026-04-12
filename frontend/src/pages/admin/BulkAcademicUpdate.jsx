import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function BulkAcademicUpdate() {
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [preview, setPreview] = useState(null);   // list of students to be affected
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/departments').then(r => setDepartments(r.data));
    api.get('/admin/sections').then(r => setSections(r.data));
  }, []);

  // Sections filtered by current selections
  const filteredSections = sections.filter(s =>
    (!selectedDept || s.department?._id === selectedDept) &&
    (!selectedYear || String(s.year) === selectedYear) &&
    (!selectedSem  || String(s.semester) === selectedSem)
  );

  // Derived label for what the promotion will do
  const promotionLabel = () => {
    if (!selectedSem) return '';
    if (selectedSem === '1') return `Semester 1 → Semester 2 (same year)`;
    const nextYear = parseInt(selectedYear) + 1;
    if (nextYear > 4) return `⚠️ Year 4 Sem 2 — students cannot be promoted further`;
    return `Year ${selectedYear} Sem 2 → Year ${nextYear} Sem 1`;
  };

  const canPromote = selectedYear !== '4' || selectedSem !== '2';

  const handlePreview = async () => {
    if (!selectedSection) return;
    setLoadingPreview(true);
    setPreview(null);
    setResult(null);
    setError('');
    try {
      const { data } = await api.get(`/admin/users?role=student&section=${selectedSection}`);
      setPreview(data);
    } catch (err) {
      setError('Failed to load student preview.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePromote = async () => {
    if (!window.confirm(`This will promote ${preview.length} student(s). Are you sure?`)) return;
    setPromoting(true);
    setResult(null);
    setError('');
    try {
      const { data } = await api.post('/admin/students/promote', { sectionId: selectedSection });
      setResult(data);
      setPreview(null);
      // Refresh sections list (new section may have been created)
      const r = await api.get('/admin/sections');
      setSections(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Promotion failed.');
    } finally {
      setPromoting(false);
    }
  };

  const resetAll = () => {
    setSelectedDept(''); setSelectedYear(''); setSelectedSem(''); setSelectedSection('');
    setPreview(null); setResult(null); setError('');
  };

  const inputStyle = { padding: '0.65rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.95rem', width: '100%' };
  const labelStyle = { fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '0.4rem', display: 'block' };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>🎓 Bulk Academic Update</h2>
        <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
          Promote an entire group of students to the next semester or academic year.
        </p>
      </div>

      {/* Step 1 — Group Selection */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', color: '#1a237e' }}>
          Step 1 — Select Student Group
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Department</label>
            <select style={inputStyle} value={selectedDept}
              onChange={e => { setSelectedDept(e.target.value); setSelectedSection(''); setPreview(null); setResult(null); }}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Year</label>
            <select style={inputStyle} value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setSelectedSection(''); setPreview(null); setResult(null); }}>
              <option value="">Select Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Semester</label>
            <select style={inputStyle} value={selectedSem}
              onChange={e => { setSelectedSem(e.target.value); setSelectedSection(''); setPreview(null); setResult(null); }}>
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Section</label>
            <select style={inputStyle} value={selectedSection}
              onChange={e => { setSelectedSection(e.target.value); setPreview(null); setResult(null); }}
              disabled={!selectedDept || !selectedYear || !selectedSem}>
              <option value="">Select Section</option>
              {filteredSections.map(s => (
                <option key={s._id} value={s._id}>{s.sectionName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Promotion preview label */}
        {selectedSem && selectedYear && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: canPromote ? '#e8f5e9' : '#fff3e0',
            border: `1px solid ${canPromote ? '#a5d6a7' : '#ffcc80'}`,
            color: canPromote ? '#1b5e20' : '#e65100',
            fontSize: '0.95rem', fontWeight: '600'
          }}>
            🔁 Promotion: {promotionLabel()}
          </div>
        )}

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handlePreview}
            disabled={!selectedSection || loadingPreview || !canPromote}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              background: (!selectedSection || !canPromote) ? '#ccc' : '#1a237e',
              color: 'white', fontWeight: '600', cursor: (!selectedSection || !canPromote) ? 'not-allowed' : 'pointer'
            }}
          >
            {loadingPreview ? 'Loading...' : '👁️ Preview Students'}
          </button>
          <button onClick={resetAll}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', color: '#555' }}>
            ✕ Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ffcdd2' }}>
          {error}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{ padding: '1.5rem', background: '#e8f5e9', color: '#1b5e20', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #a5d6a7' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Promotion Complete</div>
          <div>{result.message}</div>
        </div>
      )}

      {/* Step 2 — Preview */}
      {preview && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>
              Step 2 — Preview ({preview.length} student{preview.length !== 1 ? 's' : ''} will be promoted)
            </h3>
            <button
              onClick={handlePromote}
              disabled={promoting || preview.length === 0}
              style={{
                padding: '0.75rem 1.75rem', borderRadius: '8px', border: 'none',
                background: preview.length === 0 ? '#ccc' : 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
                color: 'white', fontWeight: '700', fontSize: '1rem',
                cursor: preview.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {promoting ? 'Promoting...' : '🚀 Confirm & Promote All'}
            </button>
          </div>

          {preview.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
              No students found in this section.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roll Number</th>
                    <th>Current</th>
                    <th>Will Become</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((s, i) => {
                    const nextSem = selectedSem === '1' ? 2 : 1;
                    const nextYear = selectedSem === '2' ? parseInt(selectedYear) + 1 : parseInt(selectedYear);
                    return (
                      <tr key={s._id} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ textAlign: 'center', color: '#999' }}>{i + 1}</td>
                        <td style={{ fontWeight: '500' }}>{s.name}</td>
                        <td style={{ color: '#666' }}>{s.email}</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.rollNumber || '-'}</td>
                        <td>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#fff3e0', color: '#e65100', fontSize: '0.85rem', fontWeight: '600' }}>
                            Y{selectedYear} S{selectedSem}
                          </span>
                        </td>
                        <td>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#e8f5e9', color: '#2e7d32', fontSize: '0.85rem', fontWeight: '600' }}>
                            Y{nextYear} S{nextSem}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
