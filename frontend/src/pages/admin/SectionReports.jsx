import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function SectionReports() {
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSection && startDate && endDate) {
      fetchSectionReport();
    }
  }, [selectedSection, startDate, endDate]);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/admin/sections');
      setSections(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSectionReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        sectionId: selectedSection,
        startDate: startDate,
        endDate: endDate
      });

      const { data } = await api.get(`/reports/section?${params}`);
      setReportData(data);
      setError('');
    } catch (err) {
      console.error('Section report error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch report';
      setError(errorMessage);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportSectionReport = async () => {
    if (!selectedSection) {
      alert('Please select a section first');
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        sectionId: selectedSection,
        startDate: startDate,
        endDate: endDate
      });

      const response = await api.get(`/reports/section/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const sectionName = sections.find(s => s._id === selectedSection)?.sectionName || 'section';
      link.setAttribute('download', `${sectionName}-report-${startDate}-to-${endDate}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#2e7d32', '#c62828', '#f57f17', '#1a237e'];

  const getSelectedSectionInfo = () => {
    return sections.find(s => s._id === selectedSection);
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
            📊 Section Reports
          </div>
          <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
            Comprehensive attendance analysis by section
          </p>
        </div>
        {reportData && (
          <button 
            className="btn btn-primary"
            onClick={exportSectionReport}
            disabled={exporting || loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            {exporting ? '⏳ Exporting...' : '📥 Export to Excel'}
          </button>
        )}
      </div>

      {/* Filters Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Choose a Section --</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.department?.name || 'N/A'} - {s.sectionName} (Year {s.year}, Sem {s.semester})
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
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || new Date().toISOString().split('T')[0]}
              disabled={!selectedSection}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
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
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              disabled={!selectedSection}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '1.1rem', color: '#666' }}>Generating report...</div>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ 
          padding: '1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {reportData && !loading && (
        <>
          {/* Section Info Header */}
          {reportData.section && (
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              color: 'white',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    opacity: 0.9, 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Section Report
                  </div>
                  <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: '700' }}>
                    {reportData.section.department?.name || 'N/A'} - {reportData.section.sectionName}
                  </h2>
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', opacity: 0.95, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                      <span>{reportData.section.department?.code || 'N/A'}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📚</span>
                      <span>Year {reportData.section.year}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📖</span>
                      <span>Semester {reportData.section.semester}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>👥</span>
                      <span>{reportData.summary?.totalStudents || 0} Students</span>
                    </span>
                  </div>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  minWidth: '200px'
                }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    Date Range
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', lineHeight: '1.4' }}>
                    {startDate && endDate ? (
                      <>
                        {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <br />
                        <span style={{ opacity: 0.7 }}>→</span>
                        <br />
                        {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </>
                    ) : (
                      'Select dates'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}>
              <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem' }}>
                Total Records
              </div>
              <div className="stat-number" style={{ color: 'white' }}>
                {reportData.summary?.totalRecords || 0}
              </div>
            </div>
            <div className="stat-card" style={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none'
            }}>
              <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem' }}>
                Present
              </div>
              <div className="stat-number" style={{ color: 'white' }}>
                {reportData.summary?.presentCount || 0}
              </div>
            </div>
            <div className="stat-card" style={{ 
              background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
              color: 'white',
              border: 'none'
            }}>
              <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem' }}>
                Absent
              </div>
              <div className="stat-number" style={{ color: 'white' }}>
                {reportData.summary?.absentCount || 0}
              </div>
            </div>
            <div className="stat-card" style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none'
            }}>
              <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem' }}>
                Attendance Rate
              </div>
              <div className="stat-number" style={{ color: 'white' }}>
                {reportData.summary?.attendanceRate || 0}%
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Period-wise Trend Chart */}
            {reportData.periodData && reportData.periodData.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📈 Attendance Trend Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.periodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="period" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: '0.85rem' }}
                    />
                    <YAxis style={{ fontSize: '0.85rem' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="present" 
                      stroke="#2e7d32" 
                      strokeWidth={2}
                      name="Present" 
                      dot={{ fill: '#2e7d32', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="absent" 
                      stroke="#c62828" 
                      strokeWidth={2}
                      name="Absent" 
                      dot={{ fill: '#c62828', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#1a237e" 
                      strokeWidth={3}
                      name="Rate %" 
                      dot={{ fill: '#1a237e', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribution Pie Chart */}
            {reportData.summary && reportData.summary.totalRecords > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🥧 Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Present', value: reportData.summary.presentCount },
                        { name: 'Absent', value: reportData.summary.absentCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#2e7d32" />
                      <Cell fill="#c62828" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Student-wise Performance */}
          {reportData.byStudent && reportData.byStudent.length > 0 && (
            <div className="card">
              <h3>Student-wise Performance</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Roll Number</th>
                      <th>Total Classes</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Attendance %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.byStudent.map((s, i) => {
                      const pct = parseFloat(s.percentage);
                      return (
                        <tr key={s.student._id}>
                          <td>{i + 1}</td>
                          <td>{s.student.name}</td>
                          <td>{s.student.rollNumber || '-'}</td>
                          <td>{s.totalClasses}</td>
                          <td style={{ color: '#2e7d32' }}>{s.presentCount}</td>
                          <td style={{ color: '#c62828' }}>{s.absentCount}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div className="pct-bar-wrapper">
                                <div 
                                  className={`pct-bar ${pct >= 75 ? '' : pct >= 60 ? 'warn' : 'danger'}`} 
                                  style={{ width: `${Math.min(pct, 100)}%` }} 
                                />
                              </div>
                              <span style={{ marginLeft: '8px' }}>{s.percentage}%</span>
                            </div>
                          </td>
                          <td>
                            {pct >= 75 ? (
                              <span className="badge badge-present">✓ Good</span>
                            ) : (
                              <span className="badge badge-absent">⚠ Low</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Student Performance Table */}
          {reportData.byStudent && reportData.byStudent.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👥 Student-wise Performance
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '0.9rem', 
                  color: '#666',
                  fontWeight: 'normal'
                }}>
                  {reportData.byStudent.length} students
                </span>
              </h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Student Name</th>
                      <th style={{ width: '120px' }}>Roll Number</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Total</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Present</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Absent</th>
                      <th style={{ width: '200px' }}>Attendance %</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.byStudent.map((s, i) => {
                      const pct = parseFloat(s.percentage);
                      return (
                        <tr key={s.student._id} style={{ 
                          background: i % 2 === 0 ? '#fafafa' : 'white'
                        }}>
                          <td style={{ textAlign: 'center', color: '#999', fontWeight: '600' }}>
                            {i + 1}
                          </td>
                          <td style={{ fontWeight: '500' }}>
                            {s.student.name}
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                            {s.student.rollNumber || '-'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>
                            {s.totalClasses}
                          </td>
                          <td style={{ textAlign: 'center', color: '#2e7d32', fontWeight: '600' }}>
                            {s.presentCount}
                          </td>
                          <td style={{ textAlign: 'center', color: '#c62828', fontWeight: '600' }}>
                            {s.absentCount}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="pct-bar-wrapper" style={{ flex: 1 }}>
                                <div 
                                  className={`pct-bar ${pct >= 75 ? '' : pct >= 60 ? 'warn' : 'danger'}`} 
                                  style={{ width: `${Math.min(pct, 100)}%` }} 
                                />
                              </div>
                              <span style={{ 
                                fontWeight: '600',
                                minWidth: '50px',
                                textAlign: 'right',
                                color: pct >= 75 ? '#2e7d32' : pct >= 60 ? '#f57f17' : '#c62828'
                              }}>
                                {s.percentage}%
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {pct >= 75 ? (
                              <span className="badge badge-present" style={{ 
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px'
                              }}>
                                ✓ Good
                              </span>
                            ) : pct >= 60 ? (
                              <span className="badge" style={{ 
                                background: '#fff3e0',
                                color: '#f57f17',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px'
                              }}>
                                ⚠ Warning
                              </span>
                            ) : (
                              <span className="badge badge-absent" style={{ 
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px'
                              }}>
                                ⚠ Low
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subject-wise Breakdown */}
          {reportData.bySubject && reportData.bySubject.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📚 Subject-wise Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.bySubject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <YAxis style={{ fontSize: '0.85rem' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="present" fill="#2e7d32" name="Present" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="absent" fill="#c62828" name="Absent" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!selectedSection && !loading && !error && (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No Section Selected</h3>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            Please select a section and time period from the filters above to generate a comprehensive report.
          </p>
        </div>
      )}

      {reportData && reportData.summary.totalRecords === 0 && !loading && (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No Attendance Data Available</h3>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>
            This section has no attendance records for the selected time period.
          </p>
          <p style={{ 
            fontSize: '0.95rem', 
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <strong>Total students in section:</strong> {reportData.summary.totalStudents || 0}
          </p>
        </div>
      )}
    </div>
  );
}
