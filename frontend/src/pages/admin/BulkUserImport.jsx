import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../utils/api';

export default function BulkUserImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSummary(null);
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setSummary(null);
    setErrorMsg('');

    try {
      // 1. Read Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (jsonData.length === 0) {
            setErrorMsg("The uploaded Excel file is empty.");
            setLoading(false);
            return;
          }

          // 2. Send to backend
          const response = await api.post('/admin/users/bulk', { users: jsonData });
          setSummary(response.data);
          setLoading(false);

        } catch (err) {
          setErrorMsg("Failed to parse Excel file. Please ensure it's a valid format.");
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setErrorMsg("An unexpected error occurred during upload.");
      setLoading(false);
    }
  };

  const downloadFailedRows = () => {
    if (!summary || !summary.failedRows || summary.failedRows.length === 0) return;

    // Convert failed rows back to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(summary.failedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Imports");
    
    // Generate file and download
    XLSX.writeFile(workbook, "Failed_Imports.xlsx");
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>📤 Bulk User Import</h2>
        <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
          Upload an Excel file to create multiple users at once. Missing Departments and Sections will be automatically generated.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
          Instructions
        </h3>
        <ul style={{ paddingLeft: '1.5rem', color: '#555', lineHeight: '1.6' }}>
          <li>Your Excel file must contain the following column headers exactly: <b>name, email, password, role, department, departmentCode, section, year, semester, rollNumber</b></li>
          <li><b>password:</b> If left blank, the user's <b>email address</b> will be used as their initial password.</li>
          <li><b>role:</b> Must be either `student` or `faculty`</li>
          <li><b>departmentCode:</b> Exactly 3 uppercase letters (e.g. <code>CSE</code>, <code>MEC</code>). If omitted, the code is auto-derived from the department name.</li>
          <li>If a Student, requires `section`, `year`, `semester`, and `department`.</li>
        </ul>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange}
            style={{
              padding: '0.5rem',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          />
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              background: (!file || loading) ? '#ccc' : '#1a237e',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (!file || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Upload & Import'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {summary && (
        <div className="card" style={{ background: '#f8f9fa' }}>
          <h3 style={{ marginBottom: '1rem' }}>Import Summary</h3>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', flex: 1, borderTop: '4px solid #4CAF50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50' }}>{summary.successCount}</div>
              <div style={{ color: '#666' }}>Users Created Successfully</div>
            </div>
            
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', flex: 1, borderTop: '4px solid #f44336', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f44336' }}>{summary.failedRows.length}</div>
              <div style={{ color: '#666' }}>Failed to Import</div>
            </div>
          </div>

          {summary.failedRows.length > 0 && (
            <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ffe0b2' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#e65100' }}>⚠️ Attention Required</h4>
              <p style={{ margin: '0 0 1rem 0', color: '#555' }}>Some rows could not be imported because they were missing required fields, or the email already existed.</p>
              
              <button 
                onClick={downloadFailedRows}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ff9800',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 Download Failed Rows Excel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
