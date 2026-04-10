'use client';
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #F1F1F4', paddingBottom: '12px' }}>
                                <Calendar size={24} color="#00C07F" />
                                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </h2>
                            </div>

                            {Object.entries(groupedLectures[date]).map(([subject, subLectures]: [string, any]) => (
                                <div key={subject} style={{ marginBottom: '28px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#5E6278', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {subject}
                                    </h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                        {subLectures.map((lecture: any) => {
                                            const videoId = getYouTubeId(lecture.video_url);
                                            return (
                                                <div key={lecture.id} className="card hover-lift" style={{ background: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
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
                                                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                            <Video size={32} color="#A1A5B7" style={{ marginBottom: '8px' }} />
                                                            <span style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 600 }}>Invalid Video URL</span>
                                                        </div>
                                                    )}
                                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1D3B' }}>{lecture.title}</h4>
                                                            <span style={{ background: '#E8FFF3', color: '#00C07F', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                                                                {lecture.time}
                                                            </span>
                                                        </div>
                                                        <p style={{ margin: 0, color: '#8F92A1', fontSize: '13px', fontWeight: 500 }}>
                                                            Class: {lecture.class_name}
                                                        </p>
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
        </DashboardLayout>
    );
}
