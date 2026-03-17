'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { ClipboardList, Plus, Calendar, FileText, CheckCircle, Clock } from 'lucide-react';

export default function TestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        test_name: '', class_id: '', subject: '', test_type: 'weekly_test',
        test_date: new Date().toISOString().split('T')[0],
        duration_minutes: 60, total_marks: 100, passing_marks: 33
    });

    useEffect(() => {
        fetchTests();
        api.get('/classes').then(res => setClasses(res.data.data)).catch(console.error);
    }, []);

    const fetchTests = () => {
        api.get('/tests').then(res => setTests(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tests', formData);
            setIsAddOpen(false);
            fetchTests();
            setFormData({ test_name: '', class_id: '', subject: '', test_type: 'weekly_test', test_date: new Date().toISOString().split('T')[0], duration_minutes: 60, total_marks: 100, passing_marks: 33 });
        } catch (error) {
            console.error('Error adding test:', error);
            alert('Failed to add test');
        }
    };

    const inputStyle: React.CSSProperties = {
        padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px',
        fontSize: '14px', background: '#F8F9FD', color: '#1A1D3B',
        outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '12px', fontWeight: 600, color: '#5E6278',
        display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>Tests & Examinations</h1>
                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                            Manage assessments, marks, and student performance.
                        </p>
                    </div>
                    <button onClick={() => setIsAddOpen(true)} style={{ background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,96,255,0.3)' }}>
                        <Plus size={16} /> Create Test
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '18px' }} />)
                    ) : tests.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', borderRadius: '18px', padding: '60px', textAlign: 'center', border: '1px solid #F0F0F5', color: '#A1A5B7' }}>
                            <ClipboardList size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <h3 style={{ fontSize: '16px', color: '#5E6278', marginBottom: '8px', fontWeight: 700 }}>No Tests Found</h3>
                            <p style={{ fontSize: '13px' }}>Create a test assessment to track student performance.</p>
                        </div>
                    ) : (
                        tests.map((test, idx) => (
                            <div key={test.id} className="animate-fade-in"
                                style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #F0F0F5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animationDelay: `${idx * 50}ms`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#4F60FF', background: '#EEF0FF', padding: '3px 10px', borderRadius: '50px', letterSpacing: '0.05em' }}>
                                            {test.test_type?.toUpperCase()}
                                        </span>
                                        <h3 style={{ fontSize: '17px', fontWeight: 700, marginTop: '10px', color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>{test.test_name}</h3>
                                        <p style={{ fontSize: '13px', color: '#A1A5B7', marginTop: '4px', fontWeight: 500 }}>
                                            {test.subject} &bull; {test.class_name}
                                        </p>
                                    </div>
                                    <span style={{ padding: '3px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, background: test.status === 'completed' ? '#D1FAE5' : '#FEF3C7', color: test.status === 'completed' ? '#059669' : '#92400E', whiteSpace: 'nowrap' }}>
                                        {test.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F0F0F5' }}>
                                    {[
                                        { icon: Calendar, label: 'Date', value: test.test_date, color: '#4F60FF', bg: '#EEF0FF' },
                                        { icon: FileText, label: 'Total Marks', value: test.total_marks, color: '#F97316', bg: '#FFF3E0' },
                                        { icon: CheckCircle, label: 'Avg Marks', value: test.average_marks || '—', color: '#10B981', bg: '#D1FAE5' }
                                    ].map((item, i) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={i} style={{ flex: 1, background: '#F8F9FD', borderRadius: '10px', padding: '10px' }}>
                                                <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                                                    <Icon size={13} color={item.color} />
                                                </div>
                                                <p style={{ fontSize: '10px', color: '#A1A5B7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</p>
                                                <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1D3B', marginTop: '2px' }}>{item.value}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ marginTop: '16px' }}>
                                    <button
                                        onClick={() => router.push(`/admin/tests/${test.id}`)}
                                        style={{ width: '100%', padding: '10px', background: '#F4F5F9', color: '#4F60FF', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#EEF0FF')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#F4F5F9')}
                                    >
                                        View Results
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Test">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Test Name</label>
                            <input required style={inputStyle} value={formData.test_name} onChange={e => setFormData({ ...formData, test_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Test Type</label>
                            <select style={inputStyle} value={formData.test_type} onChange={e => setFormData({ ...formData, test_type: e.target.value })}>
                                <option value="weekly_test">Weekly Test</option>
                                <option value="mock_test">Mock Test</option>
                                <option value="final_exam">Final Exam</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Class</label>
                            <select required style={inputStyle} value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                                <option value="">Select Class...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Subject</label>
                            <input required style={inputStyle} value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Test Date</label>
                            <input type="date" required style={inputStyle} value={formData.test_date} onChange={e => setFormData({ ...formData, test_date: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Duration (Minutes)</label>
                            <input type="number" required style={inputStyle} value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Total Marks</label>
                            <input type="number" required style={inputStyle} value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Passing Marks</label>
                            <input type="number" required style={inputStyle} value={formData.passing_marks} onChange={e => setFormData({ ...formData, passing_marks: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setIsAddOpen(false)} style={{ padding: '10px 22px', background: '#F4F5F9', color: '#5E6278', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F60FF 0%, #7B5EA7 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79,96,255,0.3)' }}>Save Test</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
