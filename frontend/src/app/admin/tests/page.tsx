'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, Calendar, FileText, CheckCircle, Clock, BookOpen, Target, Timer, Trophy, ChevronRight, LayoutGrid, Search, Filter } from 'lucide-react';

export default function TestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = () => {
        api.get('/tests').then(res => setTests(res.data.data)).catch(console.error).finally(() => setIsLoading(false));
    };



    const filteredTests = tests.filter(t => 
        t.test_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const customStyles = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.7);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
            border-radius: 24px;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .glass-card:hover {
            transform: translateY(-8px) scale(1.01);
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.08);
            border-color: rgba(255, 255, 255, 0.9);
        }
        .bg-mesh {
            background-color: #f7f8fc;
            background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.1) 0px, transparent 50%),
                              radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%),
                              radial-gradient(at 0% 50%, hsla(355,100%,93%,0.1) 0px, transparent 50%);
        }
        .modal-label { fontSize: 13px; fontWeight: 700; color: #1A1D3B; display: block; marginBottom: 8px; textTransform: uppercase; letterSpacing: 0.05em; }
        .modal-input { padding: 12px 16px; border: 1px solid #E2E8F0; borderRadius: 12px; fontSize: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%; transition: all 0.2s; }
        .modal-input:focus { border-color: #E53935; background: #FFF; box-shadow: 0 0 0 4px rgba(229,57,53,0.05); }

        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input {
            padding: 12px 16px; border: 1px solid #E2E8F0; border-radius: 12px;
            font-size: 14px; background: #F8F9FD; color: #1A1D3B; outline: none; width: 100%;
            font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus { border-color: #E53935; background: #FFF; }
    `;

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: customStyles}} />
            
            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: 'calc(100vh - 40px)', borderRadius: '24px' }}>

                {/* Header Section */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', animationDelay: '0ms' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(229,57,53,0.3)' }}>
                                <ClipboardList size={22} strokeWidth={2.5} />
                            </div>
                            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                                Examinations
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Design assessments, track <span style={{ color: '#E53935', fontWeight: 700 }}>Academic Performance</span> & insights
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search assessments..." 
                                style={{ padding: '12px 16px 12px 48px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'white', fontSize: '14px', width: '260px', outline: 'none', transition: 'all 0.2s', fontWeight: 500 }} 
                                onFocus={e => e.target.style.borderColor = '#E53935'}
                                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </div>
                        <button onClick={() => router.push('/admin/tests/create')} style={{ background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none', borderRadius: '14px', padding: '12px 24px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(26,29,59,0.4)', transition: 'all 0.2s' }}>
                            <Plus size={20} strokeWidth={2.5} /> Create Test
                        </button>
                    </div>
                </div>

                {/* Tests Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                    {isLoading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '24px' }} />)
                    ) : filteredTests.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', background: 'white', border: '2px dashed #E2E8F0', borderRadius: '24px', padding: '100px', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: '#F8F9FD', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <ClipboardList size={40} color="#CBD5E1" />
                            </div>
                            <h3 style={{ fontSize: '20px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 800 }}>No Assessments Found</h3>
                            <p style={{ fontSize: '15px', color: '#8F92A1', fontWeight: 500 }}>Create your first test to begin student performance tracking.</p>
                        </div>
                    ) : (
                        filteredTests.map((test, idx) => {
                            const isCompleted = test.status === 'completed';
                            return (
                                <div key={test.id} className="animate-fade-in glass-card" style={{ animationDelay: `${idx * 60}ms` }}>
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: 'rgba(229, 57, 53, 0.08)', color: '#E53935', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                {test.test_type?.replace('_', ' ')}
                                            </div>
                                            <div style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: isCompleted ? '#ECFDF5' : '#FFFBEB', color: isCompleted ? '#059669' : '#D97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                                {test.status?.toUpperCase()}
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.01em', marginBottom: '6px' }}>
                                            {test.test_name}
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                                            <span style={{ fontSize: '14px', color: '#5E6278', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <BookOpen size={14} /> {test.subject}
                                            </span>
                                            <span style={{ fontSize: '14px', color: '#5E6278', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <LayoutGrid size={14} /> {test.class_name}
                                            </span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                    <Calendar size={12} /> Date
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.test_date}</div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                    <Target size={12} /> Marks
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.total_marks}</div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                                    <Timer size={12} /> Dur.
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1A1D3B' }}>{test.duration_minutes}m</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => router.push(`/admin/tests/${test.id}`)}
                                            style={{ 
                                                width: '100%', padding: '14px', borderRadius: '16px', 
                                                background: isCompleted ? 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)' : '#FFFFFF', 
                                                color: isCompleted ? 'white' : '#1A1D3B', 
                                                border: isCompleted ? 'none' : '1px solid #E2E8F0',
                                                fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                boxShadow: isCompleted ? '0 8px 16px rgba(26,29,59,0.1)' : 'none'
                                            }}
                                            onMouseEnter={e => {
                                                if(!isCompleted) e.currentTarget.style.background = '#F8FAFC';
                                                else e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={e => {
                                                if(!isCompleted) e.currentTarget.style.background = '#FFFFFF';
                                                else e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {isCompleted ? <Trophy size={16} /> : <FileText size={16} />}
                                            {isCompleted ? 'Analyze Results' : 'Manage Test'}
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>


        </DashboardLayout>
    );
}
