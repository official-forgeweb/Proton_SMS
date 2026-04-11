'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Video, Search, Calendar, PlayCircle } from 'lucide-react';

export default function StudentVideoLecturesPage() {
    const [lectures, setLectures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ subject: '', date: '' });

    useEffect(() => {
        fetchLectures();
    }, [filters]);

    const fetchLectures = async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (filters.subject) params.subject = filters.subject;
            if (filters.date) params.date = filters.date;

            const res = await api.get('/video-lectures', { params });
            setLectures(res.data.data);
        } catch (error) {
            console.error('Failed to fetch lectures', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Group lectures by Date -> then by Subject
    const groupedLectures = lectures.reduce((acc: any, lecture: any) => {
        const { date, subject } = lecture;
        if (!acc[date]) acc[date] = {};
        if (!acc[date][subject]) acc[date][subject] = [];
        acc[date][subject].push(lecture);
        return acc;
    }, {});

    const dates = Object.keys(groupedLectures).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Helper to extract YouTube video ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <PlayCircle size={32} color="#00C07F" /> Recorded Lectures
                    </h1>
                    <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                        Watch the recorded sessions for your classes, organized by date and subject.
                    </p>
                </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', marginBottom: '32px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Search size={20} color="#8F92A1" />
                <input type="text" placeholder="Filter by Subject..." value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', flex: 1, minWidth: '200px' }}
                />
                <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                />
            </div>

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '20px' }} />)}
                </div>
            ) : dates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                    <Video size={64} color="#A1A5B7" style={{ marginBottom: '20px' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: '#1A1D3B', fontSize: '20px', fontWeight: 800 }}>No Lectures Available</h3>
                    <p style={{ margin: 0, color: '#8F92A1', fontSize: '15px' }}>Check back later or adjust your filters.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '40px' }}>
                    {dates.map(date => (
                        <div key={date}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: 'linear-gradient(135deg, #00C07F 0%, #009965 100%)', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0, 192, 127, 0.2)' }}>
                                    <Calendar size={24} color="#FFFFFF" strokeWidth={2.5} />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1A1D3B', margin: 0, letterSpacing: '-0.5px' }}>
                                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h2>
                                <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #E2E8F0 0%, transparent 100%)', marginLeft: '16px' }} />
                            </div>

                            {Object.entries(groupedLectures[date]).map(([subject, subLectures]: [string, any]) => (
                                <div key={subject} style={{ marginBottom: '32px', paddingLeft: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#4F60FF', background: '#EEF0FF', padding: '8px 20px', borderRadius: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(79, 96, 255, 0.1)' }}>
                                            {subject}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
                                        {subLectures.map((lecture: any) => {
                                            const videoId = getYouTubeId(lecture.video_url);
                                            return (
                                                <div key={lecture.id} style={{ background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 12px 24px rgba(26, 29, 59, 0.04)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 24px 48px rgba(26, 29, 59, 0.12)'; e.currentTarget.style.borderColor = 'rgba(0, 192, 127, 0.4)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(26, 29, 59, 0.04)'; e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'; }}
                                                >
                                                    {videoId ? (
                                                        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                                                            <iframe
                                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                title={lecture.title}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(135deg, #F8F9FD 0%, #F1F1F4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                            <Video size={40} color="#A1A5B7" style={{ marginBottom: '12px' }} />
                                                            <span style={{ color: '#8F92A1', fontSize: '14px', fontWeight: 700 }}>Invalid Video URL</span>
                                                        </div>
                                                    )}
                                                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#FFFFFF', position: 'relative' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                                            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1A1D3B', lineHeight: '1.4' }}>{lecture.title}</h4>
                                                            <div style={{ flexShrink: 0, background: 'linear-gradient(135deg, #00C07F 0%, #009965 100%)', color: '#FFFFFF', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, boxShadow: '0 4px 12px rgba(0, 192, 127, 0.25)', letterSpacing: '0.05em' }}>
                                                                {lecture.time}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5E6278', fontSize: '14px', fontWeight: 600 }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F60FF', boxShadow: '0 0 8px rgba(79, 96, 255, 0.5)' }} />
                                                            Class: <span style={{ color: '#1A1D3B', fontWeight: 800 }}>{lecture.class_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}

