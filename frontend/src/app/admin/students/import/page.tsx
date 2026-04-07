'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FormPageLayout from '@/components/FormPageLayout';
import api from '@/lib/api';
import { Upload, FileSpreadsheet, Users, X, Check, AlertCircle, Trash2, Edit2, Download } from 'lucide-react';

interface StudentRow {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    school_name: string;
    admission_type: string;
    class_id: string;
    error?: string;
    isValid?: boolean;
}

const requiredFields = ['first_name', 'phone'];
const fieldLabels: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    school_name: 'School Name',
    admission_type: 'Admission Type',
    class_id: 'Class ID',
};

const sampleCsv = `first_name,last_name,email,phone,date_of_birth,gender,school_name,admission_type
John,Doe,john.doe@email.com,+919876543210,2010-05-15,male,Springfield School,fresh
Jane,Smith,jane.smith@email.com,+919876543211,2010-07-22,female,Oak Valley Academy,other
Rahul,Sharma,rahul.sharma@email.com,+919876543212,2009-03-10,male,Riverside High,fresh`;

export default function ImportStudentsPage() {
    const router = useRouter();
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
    const [fileName, setFileName] = useState('');
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editField, setEditField] = useState('');
    const [editValue, setEditValue] = useState('');
    const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

    const loadClasses = useCallback(async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data || []);
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }, []);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            parseCsv(text);
            await loadClasses();
        };
        reader.readAsText(file);
    }, [loadClasses]);

    const parseCsv = (text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const rows = lines.slice(1).filter(line => line.trim());

        const parsed: StudentRow[] = rows.map((line, index) => {
            const values = parseCSVLine(line);
            const row: any = { id: `temp-${index}-${Date.now()}` };

            headers.forEach((header, i) => {
                if (fieldLabels[header]) {
                    row[header] = (values[i] || '').trim().replace(/^"|"$/g, '');
                }
            });

            row.gender = row.gender || 'male';
            row.admission_type = row.admission_type || 'fresh';
            row.isValid = validateRow(row);
            return row as StudentRow;
        });

        setStudents(parsed);
        setStep('preview');
    };

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const validateRow = (row: Partial<StudentRow>): boolean => {
        for (const field of requiredFields) {
            if (!row[field as keyof StudentRow]) return false;
        }
        if (row.phone && !/^\+?[\d\s-]{10,}$/.test(row.phone)) return false;
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return false;
        return true;
    };

    const updateStudent = (id: string, field: string, value: string) => {
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                updated.isValid = validateRow(updated);
                return updated;
            }
            return s;
        }));
    };

    const deleteStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const startEdit = (id: string, field: string, value: string) => {
        setEditingId(id);
        setEditField(field);
        setEditValue(value);
    };

    const saveEdit = () => {
        if (editingId) {
            updateStudent(editingId, editField, editValue);
        }
        setEditingId(null);
        setEditField('');
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditField('');
        setEditValue('');
    };

    const downloadSample = () => {
        const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'student_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        setStep('importing');
        const validStudents = students.filter(s => s.isValid);
        const errors: string[] = [];

        try {
            const res = await api.post('/students/bulk', { students: validStudents.map(s => ({
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                phone: s.phone,
                date_of_birth: s.date_of_birth,
                gender: s.gender,
                school_name: s.school_name,
                admission_type: s.admission_type,
                class_id: s.class_id || undefined,
            })) });

            setImportResult({
                success: res.data.data?.created || validStudents.length,
                failed: students.length - validStudents.length,
                errors,
            });
            setStep('complete');
        } catch (error: any) {
            console.error('Import error:', error);
            setImportResult({
                success: 0,
                failed: students.length,
                errors: [error.response?.data?.message || 'Import failed'],
            });
            setStep('complete');
        }
    };

    const validCount = students.filter(s => s.isValid).length;
    const invalidCount = students.filter(s => !s.isValid).length;

    return (
        <FormPageLayout
            title="Import Students"
            subtitle="Upload a CSV file to bulk import student records"
            backHref="/admin/students"
            backLabel="Back to Students"
            requiredRole="admin"
            icon={<Upload size={20} strokeWidth={2.5} />}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                .import-container { max-width: 1200px; }
                .upload-zone {
                    border: 2px dashed #E2E8F0;
                    border-radius: 24px;
                    padding: 60px 40px;
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    background: rgba(248, 249, 253, 0.5);
                }
                .upload-zone:hover {
                    border-color: #E53935;
                    background: rgba(229, 57, 53, 0.03);
                }
                .upload-zone.dragover {
                    border-color: #E53935;
                    background: rgba(229, 57, 53, 0.05);
                    transform: scale(1.02);
                }
                .preview-table-container {
                    max-height: 500px;
                    overflow: auto;
                    border-radius: 16px;
                    border: 1px solid #E2E8F0;
                }
                .preview-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .preview-table th {
                    background: #F8F9FD;
                    padding: 14px 12px;
                    text-align: left;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #5E6278;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    border-bottom: 1px solid #E2E8F0;
                }
                .preview-table td {
                    padding: 12px;
                    border-bottom: 1px solid #F1F2F7;
                    vertical-align: middle;
                }
                .preview-table tr:hover td {
                    background: rgba(248, 249, 253, 0.5);
                }
                .preview-table tr.invalid td {
                    background: rgba(254, 242, 242, 0.5);
                }
                .cell-input {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    font-size: 13px;
                    background: white;
                }
                .cell-input:focus {
                    outline: none;
                    border-color: #E53935;
                    box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
                }
                .edit-btn {
                    padding: 6px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #5E6278;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .edit-btn:hover {
                    background: #F1F2F7;
                    color: #E53935;
                }
                .delete-btn {
                    padding: 6px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #5E6278;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .delete-btn:hover {
                    background: #FEE2E2;
                    color: #DC2626;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                }
                .status-valid {
                    background: #DCFCE7;
                    color: #16A34A;
                }
                .status-invalid {
                    background: #FEE2E2;
                    color: #DC2626;
                }
                .stats-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    flex: 1;
                    padding: 16px 20px;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #E2E8F0;
                }
                .stat-value {
                    font-size: 24px;
                    font-weight: 800;
                    color: #1A1D3B;
                }
                .stat-label {
                    font-size: 12px;
                    color: #5E6278;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .result-card {
                    text-align: center;
                    padding: 40px;
                }
                .result-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }
            ` }} />

            <div className="import-container">
                {step === 'upload' && (
                    <>
                        <div className="upload-zone" onClick={() => document.getElementById('file-input')?.click()}>
                            <input
                                type="file"
                                id="file-input"
                                accept=".csv"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '24px',
                                background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px', color: 'white'
                            }}>
                                <FileSpreadsheet size={32} strokeWidth={2} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1D3B', marginBottom: '12px' }}>
                                Upload Student Data
                            </h3>
                            <p style={{ color: '#5E6278', fontSize: '14px', marginBottom: '24px' }}>
                                Drag and drop your CSV file here, or click to browse
                            </p>
                            <button
                                type="button"
                                style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                    color: 'white', border: 'none', borderRadius: '14px',
                                    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(229, 57, 53, 0.3)'
                                }}
                            >
                                Select CSV File
                            </button>
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={downloadSample}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 20px', background: 'white', border: '1px solid #E2E8F0',
                                    borderRadius: '12px', color: '#5E6278', fontSize: '13px', fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = '#E53935';
                                    e.currentTarget.style.color = '#E53935';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.color = '#5E6278';
                                }}
                            >
                                <Download size={16} />
                                Download Sample Template
                            </button>
                        </div>

                        <div style={{
                            marginTop: '40px', padding: '24px', background: '#F8F9FD',
                            borderRadius: '20px', border: '1px solid #E2E8F0'
                        }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '16px' }}>
                                CSV Format Requirements
                            </h4>
                            <ul style={{ fontSize: '13px', color: '#5E6278', lineHeight: 1.8, paddingLeft: '20px' }}>
                                <li>File must be in <strong>.csv</strong> format</li>
                                <li>Required columns: <strong>first_name</strong>, <strong>phone</strong></li>
                                <li>Optional columns: last_name, email, date_of_birth, gender, school_name, admission_type</li>
                                <li>Date format: YYYY-MM-DD (e.g., 2010-05-15)</li>
                                <li>Gender values: male, female, other</li>
                                <li>Admission type values: fresh, other</li>
                            </ul>
                        </div>
                    </>
                )}

                {step === 'preview' && (
                    <>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            marginBottom: '24px', padding: '16px 20px',
                            background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0'
                        }}>
                            <FileSpreadsheet size={20} style={{ color: '#E53935' }} />
                            <span style={{ fontWeight: 700, color: '#1A1D3B' }}>{fileName}</span>
                            <span style={{ fontSize: '13px', color: '#5E6278' }}>({students.length} records)</span>
                            <button
                                onClick={() => setStep('upload')}
                                style={{
                                    marginLeft: 'auto', padding: '8px 16px',
                                    background: '#F8F9FD', border: '1px solid #E2E8F0',
                                    borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                    color: '#5E6278', cursor: 'pointer'
                                }}
                            >
                                Change File
                            </button>
                        </div>

                        <div className="stats-row">
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#1A1D3B' }}>{students.length}</div>
                                <div className="stat-label">Total Records</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#16A34A' }}>{validCount}</div>
                                <div className="stat-label">Valid</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value" style={{ color: '#DC2626' }}>{invalidCount}</div>
                                <div className="stat-label">Invalid</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1D3B', marginBottom: '12px' }}>
                                Preview & Edit Records
                            </h4>
                            <p style={{ fontSize: '12px', color: '#5E6278' }}>
                                Click on any field to edit. Invalid rows are highlighted in red.
                            </p>
                        </div>

                        <div className="preview-table-container">
                            <table className="preview-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>Status</th>
                                        <th>First Name *</th>
                                        <th>Last Name</th>
                                        <th>Phone *</th>
                                        <th>Email</th>
                                        <th>Date of Birth</th>
                                        <th>Gender</th>
                                        <th>School</th>
                                        <th>Admission</th>
                                        <th style={{ width: '80px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.id} className={student.isValid ? '' : 'invalid'}>
                                            <td>
                                                <span className={`status-badge ${student.isValid ? 'status-valid' : 'status-invalid'}`}>
                                                    {student.isValid ? <Check size={12} /> : <AlertCircle size={12} />}
                                                </span>
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'first_name' ? (
                                                    <input
                                                        className="cell-input"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'first_name', student.first_name)}
                                                        style={{ cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        {student.first_name || <span style={{ color: '#DC2626' }}>-</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'last_name' ? (
                                                    <input
                                                        className="cell-input"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'last_name', student.last_name)}
                                                        style={{ cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        {student.last_name || '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'phone' ? (
                                                    <input
                                                        className="cell-input"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'phone', student.phone)}
                                                        style={{ cursor: 'pointer', padding: '4px', color: student.phone ? '#1A1D3B' : '#DC2626' }}
                                                    >
                                                        {student.phone || <span style={{ color: '#DC2626' }}>Required</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'email' ? (
                                                    <input
                                                        className="cell-input"
                                                        type="email"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'email', student.email)}
                                                        style={{ cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        {student.email || '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'date_of_birth' ? (
                                                    <input
                                                        className="cell-input"
                                                        type="date"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'date_of_birth', student.date_of_birth)}
                                                        style={{ cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        {student.date_of_birth || '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'gender' ? (
                                                    <select
                                                        className="cell-input"
                                                        value={editValue}
                                                        onChange={e => { setEditValue(e.target.value); updateStudent(student.id, 'gender', e.target.value); cancelEdit(); }}
                                                        onBlur={cancelEdit}
                                                        autoFocus
                                                    >
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'gender', student.gender)}
                                                        style={{ cursor: 'pointer', padding: '4px', textTransform: 'capitalize' }}
                                                    >
                                                        {student.gender || 'male'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'school_name' ? (
                                                    <input
                                                        className="cell-input"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'school_name', student.school_name)}
                                                        style={{ cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        {student.school_name || '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {editingId === student.id && editField === 'admission_type' ? (
                                                    <select
                                                        className="cell-input"
                                                        value={editValue}
                                                        onChange={e => { setEditValue(e.target.value); updateStudent(student.id, 'admission_type', e.target.value); cancelEdit(); }}
                                                        onBlur={cancelEdit}
                                                        autoFocus
                                                    >
                                                        <option value="fresh">Fresh</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                ) : (
                                                    <div
                                                        onClick={() => startEdit(student.id, 'admission_type', student.admission_type)}
                                                        style={{ cursor: 'pointer', padding: '4px', textTransform: 'capitalize' }}
                                                    >
                                                        {student.admission_type || 'fresh'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => {
                                                            const firstEmpty = ['first_name', 'phone', 'email', 'last_name'].find(f => !student[f as keyof StudentRow]);
                                                            if (firstEmpty) startEdit(student.id, firstEmpty, '');
                                                        }}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => deleteStudent(student.id)}
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setStep('upload')}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={handleImport}
                                disabled={validCount === 0}
                            >
                                Import {validCount} Student{validCount !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </>
                )}

                {step === 'importing' && (
                    <div className="result-card">
                        <div className="result-icon" style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)' }}>
                            <Users size={40} color="white" />
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '12px' }}>
                            Importing Students...
                        </h3>
                        <p style={{ color: '#5E6278', fontSize: '14px' }}>
                            Please wait while we process your data.
                        </p>
                        <div style={{
                            marginTop: '24px', padding: '16px 32px',
                            background: '#F8F9FD', borderRadius: '12px',
                            display: 'inline-block'
                        }}>
                            <div style={{
                                width: '200px', height: '6px', background: '#E2E8F0',
                                borderRadius: '3px', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: '60%', height: '100%',
                                    background: 'linear-gradient(90deg, #E53935, #FF7043)',
                                    borderRadius: '3px',
                                    animation: 'loading 1.5s ease-in-out infinite'
                                }} />
                            </div>
                        </div>
                        <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes loading {
                                0% { width: 0%; margin-left: 0; }
                                50% { width: 60%; margin-left: 20%; }
                                100% { width: 0%; margin-left: 100%; }
                            }
                        ` }} />
                    </div>
                )}

                {step === 'complete' && importResult && (
                    <div className="result-card">
                        <div className="result-icon" style={{ background: importResult.failed === 0 ? '#DCFCE7' : '#FEF3C7' }}>
                            {importResult.failed === 0 ? (
                                <Check size={40} color="#16A34A" />
                            ) : (
                                <AlertCircle size={40} color="#D97706" />
                            )}
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', marginBottom: '12px' }}>
                            {importResult.failed === 0 ? 'Import Successful!' : 'Import Completed with Issues'}
                        </h3>
                        <div style={{
                            display: 'flex', gap: '24px', justifyContent: 'center',
                            margin: '24px 0', padding: '20px',
                            background: '#F8F9FD', borderRadius: '16px'
                        }}>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A' }}>
                                    {importResult.success}
                                </div>
                                <div style={{ fontSize: '12px', color: '#5E6278', fontWeight: 600 }}>Imported</div>
                            </div>
                            <div style={{ width: '1px', background: '#E2E8F0' }} />
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: '#DC2626' }}>
                                    {importResult.failed}
                                </div>
                                <div style={{ fontSize: '12px', color: '#5E6278', fontWeight: 600 }}>Failed</div>
                            </div>
                        </div>
                        {importResult.errors.length > 0 && (
                            <div style={{
                                marginTop: '16px', padding: '16px',
                                background: '#FEF2F2', borderRadius: '12px',
                                textAlign: 'left', maxWidth: '400px', margin: '16px auto'
                            }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>
                                    Errors:
                                </p>
                                {importResult.errors.map((err, i) => (
                                    <p key={i} style={{ fontSize: '12px', color: '#7F1D1D' }}>{err}</p>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setStep('upload')}
                            >
                                Import More
                            </button>
                            <button
                                type="button"
                                className="btn-submit"
                                onClick={() => router.push('/admin/students')}
                            >
                                View Students
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </FormPageLayout>
    );
}
