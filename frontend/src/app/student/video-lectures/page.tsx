'use client';
import ToolBottomBar from '@/components/ToolBottomBar';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Video, Search, PlayCircle, X, Clock, ChevronLeft, Folder, Play } from 'lucide-react';

export default function StudentVideoLecturesPage() {
    const [lectures, setLectures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [activeLecture, setActiveLecture] = useState<any>(null);

    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/video-lectures');
            setLectures(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch lectures', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to extract YouTube video ID
    const getYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // --- DATA PROCESSING ---
    const subjectsMap = useMemo(() => {
        return lectures.reduce((acc: any, lecture: any) => {
            const sub = lecture.subject || 'Other';
            if (!acc[sub]) acc[sub] = [];
            acc[sub].push(lecture);
            return acc;
        }, {});
    }, [lectures]);

    const subjects = Object.keys(subjectsMap).sort();

    const recentLectures = useMemo(() => {
        return [...lectures].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()).slice(0, 4);
    }, [lectures]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return lectures.filter(l => 
            l.title?.toLowerCase().includes(q) || 
            l.subject?.toLowerCase().includes(q) ||
            l.class_name?.toLowerCase().includes(q)
        );
    }, [searchQuery, lectures]);

    // For Player View
    const subjectLectures = selectedSubject ? subjectsMap[selectedSubject] : [];
    const groupedSubjectLectures = useMemo(() => {
        if (!subjectLectures) return {};
        return subjectLectures.reduce((acc: any, lecture: any) => {
            const { date } = lecture;
            if (!acc[date]) acc[date] = [];
            acc[date].push(lecture);
            return acc;
        }, {});
    }, [subjectLectures]);
    const subjectDates = Object.keys(groupedSubjectLectures).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Auto-select latest lecture when entering a subject
    useEffect(() => {
        if (selectedSubject && subjectLectures.length > 0) {
            const isCurrentActiveInSubject = activeLecture && activeLecture.subject === selectedSubject;
            if (!isCurrentActiveInSubject) {
                const latest = [...subjectLectures].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                setActiveLecture(latest);
            }
        }
    }, [selectedSubject, subjectLectures]);

    const activeVideoId = activeLecture ? getYouTubeId(activeLecture.video_url) : null;

    // Open Player View
    const openLecture = (lecture: any) => {
        setSelectedSubject(lecture.subject);
        setActiveLecture(lecture);
        setSearchQuery('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Minimalist Card Component
    const LectureThumbnailCard = ({ lecture }: { lecture: any }) => {
        const vId = getYouTubeId(lecture.video_url);
        return (
            <div onClick={() => openLecture(lecture)} className="lecture-minimal-card">
                <div className="thumbnail-wrapper">
                    {vId ? (
                        <img src={`https://img.youtube.com/vi/${vId}/mqdefault.jpg`} alt="thumbnail" />
                    ) : (
                        <div className="no-video-fallback">
                            <Video size={24} color="#A1A5B7" />
                        </div>
                    )}
                    <div className="play-overlay">
                        <Play size={20} fill="currentColor" style={{ marginLeft: '4px' }} />
                    </div>
                    <div className="time-badge">{lecture.time}</div>
                </div>
                <div className="card-info">
                    <h4 className="card-title">{lecture.title}</h4>
                    <p className="card-meta">{lecture.subject} • {lecture.class_name}</p>
                    <p className="card-date">{new Date(lecture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout requiredRole="student">
            <style>{`
                /* Global Minimalist Styles */
                .lecture-minimal-card { cursor: pointer; display: flex; flex-direction: column; gap: 12px; }
                .thumbnail-wrapper { position: relative; width: 100%; aspect-ratio: 16/9; background: #F4F5F9; border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; }
                .thumbnail-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
                .lecture-minimal-card:hover .thumbnail-wrapper img { transform: scale(1.03); }
                .no-video-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
                .play-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; background: rgba(26, 29, 59, 0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.2s ease; backdrop-filter: blur(4px); }
                .lecture-minimal-card:hover .play-overlay { opacity: 1; }
                .time-badge { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); color: white; font-size: 11px; font-weight: 600; padding: 3px 6px; border-radius: 4px; letter-spacing: 0.02em; }
                .card-info { display: flex; flex-direction: column; gap: 4px; }
                .card-title { margin: 0; font-size: 15px; font-weight: 600; color: #1A1D3B; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .card-meta { margin: 0; font-size: 13px; color: #5E6278; font-weight: 500; }
                .card-date { margin: 0; font-size: 12px; color: #A1A5B7; }

                /* Layout */
                .layout-container { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
                .player-section { flex: 1 1 600px; display: flex; flex-direction: column; gap: 16px; }
                .playlist-section { flex: 0 0 360px; width: 100%; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; flex-direction: column; height: calc(100vh - 180px); min-height: 500px; max-height: 800px; }
                @media (max-width: 1024px) { .playlist-section { flex: 1 1 100%; height: 500px; } }
                
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94A3B8; }
            `}</style>

            {/* HEADER */}
            <div style={{ marginBottom: '32px', borderBottom: '1px solid #E2E8F0', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {selectedSubject && (
                        <button onClick={() => setSelectedSubject(null)} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#1A1D3B' }} onMouseEnter={e => e.currentTarget.style.background = '#F8F9FD'} onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1D3B', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                            {selectedSubject ? `${selectedSubject}` : 'Course Library'}
                        </h1>
                        <p style={{ margin: 0, color: '#8F92A1', fontSize: '14px', fontWeight: 500 }}>
                            {selectedSubject ? 'Browse and watch recorded sessions for this subject.' : 'Access your complete archive of recorded classes.'}
                        </p>
                    </div>
                </div>

                {!selectedSubject && (
                    <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px', maxWidth: '400px' }}>
                        <Search size={18} color="#A1A5B7" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" placeholder="Search title, subject, or class..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', outline: 'none', fontSize: '14px', color: '#1A1D3B', transition: 'all 0.2s', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = '#4F60FF'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 96, 255, 0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8F92A1', padding: 0 }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '8px' }} />)}
                </div>
            ) : (
                <>
                    {/* HUB VIEW */}
                    {!selectedSubject && !searchQuery && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {/* Subjects Grid */}
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1D3B', margin: '0 0 20px 0' }}>All Subjects</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                    {subjects.map(sub => {
                                        const count = subjectsMap[sub].length;
                                        return (
                                            <div 
                                                key={sub} onClick={() => setSelectedSubject(sub)}
                                                style={{ 
                                                    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px',
                                                    display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s ease',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#A1A5B7'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                                        <Folder size={20} color="#4F60FF" />
                                                    </div>
                                                    <div>
                                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1D3B' }}>{sub}</h3>
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>{count} Lecture{count !== 1 && 's'}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F4F5F9', paddingTop: '16px', fontSize: '13px', color: '#4F60FF', fontWeight: 600 }}>
                                                    View Course Material <span>→</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Recent Lectures */}
                            {recentLectures.length > 0 && (
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1D3B', margin: '0 0 20px 0' }}>Recently Added</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                        {recentLectures.map(lecture => <LectureThumbnailCard key={`recent-${lecture.id}`} lecture={lecture} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SEARCH RESULTS VIEW */}
                    {!selectedSubject && searchQuery && (
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1D3B', margin: '0 0 4px 0' }}>Search Results</h2>
                                <p style={{ color: '#8F92A1', fontSize: '14px', margin: 0 }}>Found {searchResults.length} matching lectures</p>
                            </div>
                            {searchResults.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '8px', border: '1px dashed #E2E8F0' }}>
                                    <Search size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 16px auto' }} />
                                    <h3 style={{ margin: '0 0 8px 0', color: '#1A1D3B', fontSize: '16px', fontWeight: 600 }}>No results found</h3>
                                    <p style={{ margin: 0, color: '#8F92A1', fontSize: '14px' }}>Try adjusting your search terms.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                    {searchResults.map(lecture => <LectureThumbnailCard key={`search-${lecture.id}`} lecture={lecture} />)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PLAYER VIEW */}
                    {selectedSubject && (
                        <div className="layout-container">
                            {/* Player */}
                            <div className="player-section">
                                {activeLecture ? (
                                    <>
                                        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                            {activeVideoId ? (
                                                <iframe
                                                    style={{ width: '100%', height: '100%', border: 0 }}
                                                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0`}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    title={activeLecture.title}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                                    <Video size={40} color="#A1A5B7" />
                                                    <span style={{ color: '#8F92A1', fontSize: '14px' }}>Invalid Video Source</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1D3B', margin: '0 0 12px 0', lineHeight: '1.3' }}>
                                                {activeLecture.title}
                                            </h2>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#5E6278', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                                                 <span style={{ fontWeight: 500, color: '#4F60FF' }}>{activeLecture.subject}</span>
                                                 <span style={{ color: '#E2E8F0' }}>|</span>
                                                 <span>Class: {activeLecture.class_name}</span>
                                                 <span style={{ color: '#E2E8F0' }}>|</span>
                                                 <span>{new Date(activeLecture.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ background: '#F8F9FD', borderRadius: '8px', border: '1px dashed #CBD5E1', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                        <PlayCircle size={32} color="#A1A5B7" />
                                        <h3 style={{ margin: 0, color: '#5E6278', fontSize: '16px', fontWeight: 500 }}>Select a lecture to watch</h3>
                                    </div>
                                )}
                            </div>

                            {/* Playlist Sidebar */}
                            <div className="playlist-section">
                                <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F9FD', borderRadius: '8px 8px 0 0' }}>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1D3B' }}>Course Content</h3>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>{subjectLectures.length} videos</span>
                                </div>
                                <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                                    {subjectDates.length === 0 ? (
                                        <div style={{ padding: '32px', textAlign: 'center', color: '#8F92A1', fontSize: '13px' }}>Empty playlist.</div>
                                    ) : (
                                        subjectDates.map(date => (
                                            <div key={date}>
                                                <div style={{ background: '#FFFFFF', padding: '12px 20px', fontSize: '12px', fontWeight: 600, color: '#8F92A1', borderBottom: '1px solid #E2E8F0', borderTop: '1px solid #E2E8F0', marginTop: '-1px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div>
                                                    {groupedSubjectLectures[date].map((lecture: any) => {
                                                        const isActive = activeLecture?.id === lecture.id;
                                                        return (
                                                            <div 
                                                                key={lecture.id}
                                                                onClick={() => setActiveLecture(lecture)}
                                                                style={{ 
                                                                    padding: '16px 20px', borderBottom: '1px solid #F4F5F9', cursor: 'pointer',
                                                                    background: isActive ? '#EEF0FF' : '#FFFFFF',
                                                                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                                                                    transition: 'background 0.2s ease'
                                                                }}
                                                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8F9FD'; }}
                                                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#FFFFFF'; }}
                                                            >
                                                                <div style={{ marginTop: '2px', color: isActive ? '#4F60FF' : '#CBD5E1', transition: 'color 0.2s' }}>
                                                                    <PlayCircle size={18} fill={isActive ? '#EEF0FF' : 'transparent'} />
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500, color: isActive ? '#4F60FF' : '#1A1D3B', lineHeight: '1.4', marginBottom: '6px', transition: 'color 0.2s' }}>
                                                                        {lecture.title}
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8F92A1', fontWeight: 500 }}>
                                                                        <Clock size={12} /> {lecture.time}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
            <ToolBottomBar />
        </DashboardLayout>
    );
}

