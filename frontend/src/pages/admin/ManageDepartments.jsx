import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [deptFormData, setDeptFormData] = useState({ name: '', code: '' });
  const [sectionFormData, setSectionFormData] = useState({ 
    department: '', 
    year: '', 
    semester: '', 
    sectionName: '' 
  });
  const [activeTab, setActiveTab] = useState('departments');
  const [deptFilter, setDeptFilter] = useState('');
  const [sectionFilters, setSectionFilters] = useState({ department: '', year: '', semester: '' });

  useEffect(() => {
    fetchDepartments();
    fetchSections();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/admin/sections');
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      if (deptFormData._id) {
        await api.put(`/admin/departments/${deptFormData._id}`, deptFormData);
      } else {
        await api.post('/admin/departments', deptFormData);
      }
      setDeptFormData({ name: '', code: '' });
      setShowDeptForm(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to save department'));
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        departmentId: sectionFormData.department,
        year: parseInt(sectionFormData.year),
        semester: parseInt(sectionFormData.semester),
        sectionName: sectionFormData.sectionName
      };
      
      if (sectionFormData._id) {
        await api.put(`/admin/sections/${sectionFormData._id}`, payload);
      } else {
        await api.post('/admin/sections', payload);
      }
      setSectionFormData({ department: '', year: '', semester: '', sectionName: '' });
      setShowSectionForm(false);
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Error: ' + (error.response?.data?.message || 'Failed to save section'));
    }
  };

  const handleEditDept = (department) => {
    setDeptFormData(department);
    setShowDeptForm(true);
  };

  const handleEditSection = (section) => {
    setSectionFormData({
      _id: section._id,
      department: section.department?._id || section.department,
      year: section.year,
      semester: section.semester,
      sectionName: section.sectionName
    });
    setShowSectionForm(true);
  };

  const handleDeleteDept = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? This may affect related sections and users.')) {
      try {
        await api.delete(`/admin/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Error: ' + (error.response?.data?.message || 'Failed to delete department'));
      }
    }
  };

  const handleDeleteSection = async (id) => {
    if (window.confirm('Are you sure you want to delete this section? This may affect related students and subjects.')) {
      try {
        await api.delete(`/admin/sections/${id}`);
        fetchSections();
      } catch (error) {
        console.error('Error deleting section:', error);
        alert('Error: ' + (error.response?.data?.message || 'Failed to delete section'));
      }
    }
  };

  // Filtered departments (by name or code search)
  const visibleDepts = departments.filter((d) => {
    if (!deptFilter) return true;
    const q = deptFilter.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
  });

  // Filtered sections
  const visibleSections = sections.filter((s) => {
    if (sectionFilters.department && s.department?._id !== sectionFilters.department) return false;
    if (sectionFilters.year && String(s.year) !== sectionFilters.year) return false;
    if (sectionFilters.semester && String(s.semester) !== sectionFilters.semester) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <div style={{ fontSize: '1.1rem', color: '#666' }}>Loading...</div>
      </div>
    );
  }

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
            🏛️ Academic Structure
          </div>
          <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
            Manage departments, sections, years, and semesters
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <button
          onClick={() => setActiveTab('departments')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'departments' ? '3px solid #667eea' : '3px solid transparent',
            color: activeTab === 'departments' ? '#667eea' : '#666',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          🏛️ Departments
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          style={{
            padding: '1rem 2rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'sections' ? '3px solid #667eea' : '3px solid transparent',
            color: activeTab === 'sections' ? '#667eea' : '#666',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          📚 Sections
        </button>
      </div>

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => {
                setShowDeptForm(true);
                setDeptFormData({ name: '', code: '' });
              }}
            >
              ➕ Add Department
            </button>
          </div>

          {showDeptForm && (
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                {deptFormData._id ? '✏️ Edit Department' : '➕ New Department'}
              </h3>
              <form onSubmit={handleDeptSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,0.9)'
                    }}>
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={deptFormData.name}
                      onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                      required
                      placeholder="e.g., Computer Science Engineering"
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
                      Department Code
                    </label>
                    <input
                      type="text"
                      value={deptFormData.code}
                      onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                      required
                      placeholder="e.g., CSE"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        fontSize: '1rem',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'white',
                    color: '#11998e',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    {deptFormData._id ? '✓ Update' : '+ Create'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowDeptForm(false);
                      setDeptFormData({ name: '', code: '' });
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
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📋 All Departments ({visibleDepts.length})</h3>
              <input
                type="text"
                placeholder="🔍 Search by name or code..."
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{ padding: '0.5rem 0.9rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', width: '240px' }}
              />
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Department Name</th>
                    <th style={{ width: '150px' }}>Code</th>
                    <th style={{ width: '180px' }}>Created At</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDepts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        No departments match your search.
                      </td>
                    </tr>
                  ) : (
                    visibleDepts.map((dept, i) => (
                      <tr key={dept._id} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ textAlign: 'center', color: '#999', fontWeight: '600' }}>{i + 1}</td>
                        <td style={{ fontWeight: '500' }}>{dept.name}</td>
                        <td>
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            background: '#e3f2fd',
                            color: '#1565c0',
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem'
                          }}>
                            {dept.code}
                          </span>
                        </td>
                        <td style={{ color: '#666' }}>{new Date(dept.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditDept(dept)}
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
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteDept(dept._id)}
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
                              Delete
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
        </>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => {
                setShowSectionForm(true);
                setSectionFormData({ department: '', year: '', semester: '', sectionName: '' });
              }}
            >
              ➕ Add Section
            </button>
          </div>

          {showSectionForm && (
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                {sectionFormData._id ? '✏️ Edit Section' : '➕ New Section'}
              </h3>
              <form onSubmit={handleSectionSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
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
                      value={sectionFormData.department}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, department: e.target.value })}
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
                        <option key={d._id} value={d._id}>{d.name}</option>
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
                      Year
                    </label>
                    <select
                      value={sectionFormData.year}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, year: e.target.value })}
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
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
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
                      Semester
                    </label>
                    <select
                      value={sectionFormData.semester}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, semester: e.target.value })}
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
                      <option value="">Select Semester</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
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
                      Section Name
                    </label>
                    <input
                      type="text"
                      value={sectionFormData.sectionName}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, sectionName: e.target.value.toUpperCase() })}
                      required
                      placeholder="e.g., A, B, C"
                      maxLength="2"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.95)',
                        color: '#333',
                        fontSize: '1rem',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>
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
                    {sectionFormData._id ? '✓ Update' : '+ Create'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowSectionForm(false);
                      setSectionFormData({ department: '', year: '', semester: '', sectionName: '' });
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
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📋 All Sections ({visibleSections.length})</h3>
            </div>

            {/* Section Filter Bank */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '150px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Department</label>
                <select
                  value={sectionFilters.department}
                  onChange={(e) => setSectionFilters({ ...sectionFilters, department: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '110px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#555' }}>Year</label>
                <select
                  value={sectionFilters.year}
                  onChange={(e) => setSectionFilters({ ...sectionFilters, year: e.target.value })}
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
                  value={sectionFilters.semester}
                  onChange={(e) => setSectionFilters({ ...sectionFilters, semester: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                >
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
              {(sectionFilters.department || sectionFilters.year || sectionFilters.semester) && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => setSectionFilters({ department: '', year: '', semester: '' })}
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
                    <th style={{ width: '50px' }}>#</th>
                    <th>Department</th>
                    <th style={{ width: '100px' }}>Year</th>
                    <th style={{ width: '120px' }}>Semester</th>
                    <th style={{ width: '120px' }}>Section</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSections.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        No sections match the current filters.
                      </td>
                    </tr>
                  ) : (
                    visibleSections.map((section, i) => (
                      <tr key={section._id} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                        <td style={{ textAlign: 'center', color: '#999', fontWeight: '600' }}>{i + 1}</td>
                        <td style={{ fontWeight: '500' }}>{section.department?.name || 'N/A'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}>
                            Year {section.year}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            background: '#fff3e0',
                            color: '#f57f17',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}>
                            Sem {section.semester}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            background: '#e3f2fd',
                            color: '#1565c0',
                            fontWeight: '700',
                            fontSize: '1rem',
                            fontFamily: 'monospace'
                          }}>
                            {section.sectionName}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditSection(section)}
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
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteSection(section._id)}
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
                              Delete
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
        </>
      )}
    </div>
  );
}
