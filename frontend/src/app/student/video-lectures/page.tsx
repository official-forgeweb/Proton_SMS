'use client';
import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Video, Search, PlayCircle, X, Clock, ChevronLeft, Folder, Play, Monitor, Calendar, ChevronRight, ExternalLink } from 'lucide-react';

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

    // Minimalist Card Component (enhanced with premium styling)
    const LectureThumbnailCard = ({ lecture }: { lecture: any }) => {
        const vId = getYouTubeId(lecture.video_url);
        return (
            <div 
                onClick={() => openLecture(lecture)} 
                className="lecture-card"
                style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0px', 
                    background: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
                    backdropFilter: 'blur(16px)',
                    position: 'relative'
                }}
            >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0D0F21', overflow: 'hidden' }}>
                    {vId ? (
                        <img 
                            src={`https://img.youtube.com/vi/${vId}/mqdefault.jpg`} 
                            alt="thumbnail" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)' }}>
                            <Video size={32} color="rgba(255, 255, 255, 0.4)" />
                        </div>
                    )}
                    
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Premium Play Button Overlay */}
                    <div 
                        className="play-overlay-button"
                        style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%) scale(0.9)', 
                            width: '52px', 
                            height: '52px', 
                            background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white', 
                            opacity: 0, 
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                            boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)',
                            border: '2px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <Play size={22} fill="currentColor" style={{ marginLeft: '4px' }} />
                    </div>

                    {/* Time & Subject Badges */}
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(13, 15, 33, 0.75)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {lecture.subject}
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.02em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Clock size={11} /> {lecture.time || 'N/A'}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
                    <h4 style={{ 
                        margin: 0, 
                        fontSize: '15px', 
                        fontWeight: 700, 
                        color: '#1A1D3B', 
                        lineHeight: '1.4', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        height: '42px'
                    }}>
                        {lecture.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ 
                            fontSize: '12px', 
                            color: '#5E6278', 
                            fontWeight: 600, 
                            background: '#F4F5F9', 
                            padding: '4px 8px', 
                            borderRadius: '6px' 
                        }}>
                            {lecture.class_name}
                        </span>
                        <span style={{ fontSize: '12px', color: '#8F92A1', fontWeight: 500 }}>
                            {new Date(lecture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout requiredRole="student">
            <style>{`
                /* Global Premium Styles */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .subject-card {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .subject-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(229, 57, 53, 0.3) !important;
                    box-shadow: 0 12px 30px rgba(229, 57, 53, 0.08) !important;
                }

                .lecture-card {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .lecture-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 30px rgba(13, 15, 33, 0.08) !important;
                }
                .lecture-card:hover img {
                    transform: scale(1.05);
                }
                .lecture-card:hover .play-overlay-button {
                    opacity: 1 !important;
                    transform: translate(-50%, -50%) scale(1) !important;
                }

                .search-input-glow:focus {
                    border-color: #E53935 !important;
                    box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.15) !important;
                }

                .playlist-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .playlist-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .playlist-scroll::-webkit-scrollbar-thumb {
                    background: rgba(229, 57, 53, 0.2);
                    border-radius: 10px;
                }
                .playlist-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(229, 57, 53, 0.4);
                }

                /* Layout */
                .layout-container { 
                    display: flex; 
                    gap: 32px; 
                    align-items: flex-start; 
                    flex-wrap: wrap; 
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .player-section { 
                    flex: 1 1 600px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 24px; 
                }
                .playlist-section { 
                    flex: 0 0 380px; 
                    width: 100%; 
                }
                @media (max-width: 1024px) { 
                    .playlist-section { 
                        flex: 1 1 100%; 
                        max-height: 550px; 
                    } 
                }

                /* Skeleton pulse */
                .skeleton-pulse {
                    background: linear-gradient(-90deg, #F0F0F5 0%, #E2E8F0 50%, #F0F0F5 100%);
                    background-size: 400% 400%;
                    animation: pulse 1.5s ease-in-out infinite;
                }
                @keyframes pulse {
                    0% { background-position: 0% 0%; }
                    100% { background-position: -135% 0%; }
                }
            `}</style>

            <div style={{ paddingBottom: '120px', fontFamily: '"Poppins", "Inter", sans-serif', color: '#1A1D3B' }}>
                {/* HUB VIEW HEADER */}
                {!selectedSubject && (
                    <div style={{
                        background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        color: '#FFFFFF',
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: '40px',
                        boxShadow: '0 20px 40px rgba(13, 15, 33, 0.15)'
                    }} className="animate-fade-in-up">
                        {/* Floating background shapes */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-10%',
                            width: '350px',
                            height: '350px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(229, 57, 53, 0.15) 0%, rgba(229, 57, 53, 0) 70%)',
                            filter: 'blur(40px)',
                            pointerEvents: 'none'
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '-20%',
                            left: '10%',
                            width: '250px',
                            height: '250px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(79, 96, 255, 0.1) 0%, rgba(79, 96, 255, 0) 70%)',
                            filter: 'blur(30px)',
                            pointerEvents: 'none'
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 1 }}>
                            <div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: '100px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#FFCDD2',
                                    marginBottom: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <Monitor size={14} /> Recorded Lecture Lounge
                                </div>
                                <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                                    Academic Video Library
                                </h1>
                                <p style={{ margin: 0, color: '#B0B3C6', fontSize: '15px', fontWeight: 400, maxWidth: '500px', lineHeight: 1.5 }}>
                                    Access your complete archive of recorded classes, search for topics, and review lectures at your own pace.
                                </p>
                            </div>

                            {/* Elegant Search Bar */}
                            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                                <Search size={18} color="#A1A5B7" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Search lectures, subjects, class..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '14px 16px 14px 48px', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(255, 255, 255, 0.15)', 
                                        background: 'rgba(255, 255, 255, 0.06)', 
                                        outline: 'none', 
                                        fontSize: '14px', 
                                        color: '#FFFFFF', 
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                                        boxSizing: 'border-box',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    className="search-input-glow"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')} 
                                        style={{ 
                                            position: 'absolute', 
                                            right: '16px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)', 
                                            background: 'none', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            color: '#A1A5B7', 
                                            padding: 0 
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div 
                                key={i} 
                                className="skeleton-pulse" 
                                style={{ height: '220px', borderRadius: '20px' }} 
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* HUB VIEW */}
                        {!selectedSubject && !searchQuery && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {/* Subjects Grid */}
                                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, letterSpacing: '-0.01em' }}>
                                            Course Library by Subject
                                        </h2>
                                        <span style={{ fontSize: '13px', color: '#5E6278', fontWeight: 600, background: '#F4F5F9', padding: '6px 12px', borderRadius: '100px' }}>
                                            {subjects.length} Subjects Total
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                        {subjects.map(sub => {
                                            const count = subjectsMap[sub].length;
                                            return (
                                                <div 
                                                    key={sub} 
                                                    onClick={() => setSelectedSubject(sub)}
                                                    className="subject-card"
                                                    style={{ 
                                                        background: 'rgba(255, 255, 255, 0.9)', 
                                                        border: '1px solid rgba(226, 232, 240, 0.8)', 
                                                        borderRadius: '20px', 
                                                        padding: '24px',
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        cursor: 'pointer', 
                                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
                                                        backdropFilter: 'blur(16px)',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '4px',
                                                        background: 'linear-gradient(90deg, #E53935 0%, rgba(229,57,53,0.3) 100%)'
                                                    }} />

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                                        <div style={{ 
                                                            width: '52px', 
                                                            height: '52px', 
                                                            borderRadius: '16px', 
                                                            background: 'rgba(229, 57, 53, 0.08)', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            border: '1px solid rgba(229, 57, 53, 0.15)',
                                                            color: '#E53935'
                                                        }}>
                                                            <Folder size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1A1D3B', letterSpacing: '-0.01em' }}>{sub}</h3>
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                                                {count} Video Lecture{count !== 1 && 's'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'space-between', 
                                                        borderTop: '1px solid rgba(226, 232, 240, 0.6)', 
                                                        paddingTop: '16px', 
                                                        fontSize: '13px', 
                                                        color: '#E53935', 
                                                        fontWeight: 700,
                                                        marginTop: 'auto'
                                                    }}>
                                                        Enter Subject Playlist 
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Recent Lectures */}
                                {recentLectures.length > 0 && (
                                    <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', marginTop: '16px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', marginBottom: '24px', letterSpacing: '-0.01em' }}>
                                            Recently Uploaded Lectures
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '28px' }}>
                                            {recentLectures.map(lecture => (
                                                <LectureThumbnailCard key={`recent-${lecture.id}`} lecture={lecture} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEARCH RESULTS VIEW */}
                        {!selectedSubject && searchQuery && (
                            <div className="animate-fade-in-up">
                                <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                                            Search Results
                                        </h2>
                                        <p style={{ color: '#5E6278', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                            Found {searchResults.length} matching session{searchResults.length !== 1 && 's'} for &ldquo;{searchQuery}&rdquo;
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        style={{ 
                                            padding: '8px 16px', 
                                            background: '#F4F5F9', 
                                            border: 'none', 
                                            borderRadius: '10px', 
                                            color: '#E53935', 
                                            fontSize: '13px', 
                                            fontWeight: 700, 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Clear Search
                                    </button>
                                </div>
                                {searchResults.length === 0 ? (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '80px 20px', 
                                        background: 'rgba(255, 255, 255, 0.9)', 
                                        borderRadius: '20px', 
                                        border: '1px dashed rgba(226, 232, 240, 0.8)',
                                        backdropFilter: 'blur(16px)'
                                    }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '20px',
                                            background: '#F4F5F9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px auto',
                                            color: '#A1A5B7'
                                        }}>
                                            <Search size={28} />
                                        </div>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#1A1D3B', fontSize: '18px', fontWeight: 700 }}>No sessions found</h3>
                                        <p style={{ margin: 0, color: '#5E6278', fontSize: '14px', fontWeight: 500 }}>
                                            We couldn&apos;t find any lectures matching &ldquo;{searchQuery}&rdquo;. Try using different keywords.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '28px' }}>
                                        {searchResults.map(lecture => (
                                            <LectureThumbnailCard key={`search-${lecture.id}`} lecture={lecture} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PLAYER VIEW */}
                        {selectedSubject && (
                            <div className="animate-fade-in-up">
                                {/* SUBJECT PLAYER HEADER */}
                                <div style={{ 
                                    marginBottom: '32px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    flexWrap: 'wrap', 
                                    gap: '20px',
                                    background: 'rgba(255, 255, 255, 0.9)', 
                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                    borderRadius: '20px',
                                    padding: '20px 24px',
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <button 
                                            onClick={() => setSelectedSubject(null)} 
                                            style={{ 
                                                background: '#F4F5F9', 
                                                border: '1px solid rgba(226, 232, 240, 0.6)', 
                                                width: '44px', 
                                                height: '44px', 
                                                borderRadius: '12px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                cursor: 'pointer', 
                                                transition: 'all 0.2s', 
                                                color: '#1A1D3B' 
                                            }} 
                                            onMouseEnter={e => { e.currentTarget.style.background = '#E53935'; e.currentTarget.style.color = '#FFFFFF'; }} 
                                            onMouseLeave={e => { e.currentTarget.style.background = '#F4F5F9'; e.currentTarget.style.color = '#1A1D3B'; }}
                                        >
                                            <ChevronLeft size={22} />
                                        </button>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ 
                                                    fontSize: '11px', 
                                                    fontWeight: 700, 
                                                    background: 'rgba(229, 57, 53, 0.08)', 
                                                    color: '#E53935', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '100px',
                                                    border: '1px solid rgba(229, 57, 53, 0.15)'
                                                }}>
                                                    Video Classroom
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#5E6278', fontWeight: 500 }}>
                                                    &bull; {subjectLectures.length} Recorded Sessions
                                                </span>
                                            </div>
                                            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', margin: 0, letterSpacing: '-0.02em' }}>
                                                {selectedSubject}
                                            </h1>
                                        </div>
                                    </div>
                                </div>

                                <div className="layout-container">
                                    {/* Left: Player Section */}
                                    <div className="player-section">
                                        {activeLecture ? (
                                            <>
                                                {/* Cinematic Screen container */}
                                                <div style={{ 
                                                    width: '100%', 
                                                    aspectRatio: '16/9', 
                                                    background: '#0D0F21', 
                                                    borderRadius: '24px', 
                                                    overflow: 'hidden', 
                                                    border: '1px solid rgba(13, 15, 33, 0.2)',
                                                    boxShadow: '0 25px 60px rgba(13, 15, 33, 0.25)',
                                                    position: 'relative'
                                                }}>
                                                    {activeVideoId ? (
                                                        <iframe
                                                            style={{ width: '100%', height: '100%', border: 0 }}
                                                            src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0&rel=0&modestbranding=1`}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            title={activeLecture.title}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                                                <Video size={32} />
                                                            </div>
                                                            <span style={{ color: '#B0B3C6', fontSize: '15px', fontWeight: 500 }}>No video source configured or invalid URL</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Lecture Details Card */}
                                                <div style={{ 
                                                    background: 'rgba(255, 255, 255, 0.9)', 
                                                    border: '1px solid rgba(226, 232, 240, 0.8)', 
                                                    borderRadius: '24px',
                                                    padding: '28px',
                                                    backdropFilter: 'blur(16px)',
                                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                                                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1D3B', margin: 0, lineHeight: '1.4', letterSpacing: '-0.01em' }}>
                                                            {activeLecture.title}
                                                        </h2>
                                                    </div>

                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '12px', 
                                                        flexWrap: 'wrap', 
                                                        paddingBottom: '20px', 
                                                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                                        marginBottom: '20px'
                                                    }}>
                                                        <span style={{ 
                                                            fontSize: '12px', 
                                                            fontWeight: 700, 
                                                            background: 'rgba(229, 57, 53, 0.08)', 
                                                            color: '#E53935', 
                                                            padding: '6px 12px', 
                                                            borderRadius: '8px' 
                                                        }}>
                                                            {activeLecture.subject}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '12px', 
                                                            fontWeight: 600, 
                                                            background: '#F4F5F9', 
                                                            color: '#5E6278', 
                                                            padding: '6px 12px', 
                                                            borderRadius: '8px' 
                                                        }}>
                                                            Class: {activeLecture.class_name}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '12px', 
                                                            fontWeight: 600, 
                                                            background: '#F4F5F9', 
                                                            color: '#5E6278', 
                                                            padding: '6px 12px', 
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <Clock size={12} /> Duration: {activeLecture.time}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '12px', 
                                                            fontWeight: 600, 
                                                            background: '#F4F5F9', 
                                                            color: '#5E6278', 
                                                            padding: '6px 12px', 
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}>
                                                            <Calendar size={12} /> Uploaded: {new Date(activeLecture.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                                        {activeLecture.teacher_name && (
                                                            <div>
                                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instructor</h4>
                                                                <span style={{ fontSize: '14px', color: '#5E6278', fontWeight: 500 }}>{activeLecture.teacher_name}</span>
                                                            </div>
                                                        )}
                                                        {(activeLecture.chapter || activeLecture.topic) && (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                                {activeLecture.chapter && (
                                                                    <div>
                                                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chapter</h4>
                                                                        <span style={{ fontSize: '14px', color: '#5E6278', fontWeight: 500 }}>{activeLecture.chapter}</span>
                                                                    </div>
                                                                )}
                                                                {activeLecture.topic && (
                                                                    <div>
                                                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic</h4>
                                                                        <span style={{ fontSize: '14px', color: '#5E6278', fontWeight: 500 }}>{activeLecture.topic}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Description</h4>
                                                            <p style={{ margin: 0, color: '#5E6278', fontSize: '14px', lineHeight: 1.6, fontWeight: 400 }}>
                                                                {activeLecture.description || `This recorded session covers the core concepts, practical questions, and class exercises conducted on ${new Date(activeLecture.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}. Use this video recording to clarify complex subjects and prep for upcoming assessments.`}
                                                            </p>
                                                        </div>
                                                        {activeLecture.notes && (
                                                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#1A1D3B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Study Notes & Resources</h4>
                                                                <p style={{ margin: 0, color: '#4F60FF', fontSize: '13px', fontWeight: 600 }}>
                                                                    {activeLecture.notes.startsWith('http') ? (
                                                                        <a href={activeLecture.notes} target="_blank" rel="noreferrer" style={{ color: '#4F60FF', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            Access Study Materials <ExternalLink size={12} />
                                                                        </a>
                                                                    ) : (
                                                                        <span style={{ color: '#5E6278', fontWeight: 400 }}>{activeLecture.notes}</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ 
                                                background: 'rgba(255, 255, 255, 0.9)', 
                                                borderRadius: '24px', 
                                                border: '1px dashed rgba(226, 232, 240, 0.8)', 
                                                height: '420px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                flexDirection: 'column', 
                                                gap: '16px',
                                                backdropFilter: 'blur(16px)',
                                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)'
                                            }}>
                                                <div style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    borderRadius: '50%',
                                                    background: '#F4F5F9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#A1A5B7'
                                                }}>
                                                    <PlayCircle size={32} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1A1D3B', fontSize: '18px', fontWeight: 700 }}>Select a lecture to watch</h3>
                                                <p style={{ margin: 0, color: '#5E6278', fontSize: '14px', fontWeight: 500 }}>Select any class from the playlist to load the interactive player.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Playlist Sidebar Section */}
                                    <div className="playlist-section" style={{ 
                                        background: 'rgba(255, 255, 255, 0.9)', 
                                        border: '1px solid rgba(226, 232, 240, 0.8)', 
                                        borderRadius: '24px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        height: 'calc(100vh - 200px)', 
                                        minHeight: '500px', 
                                        maxHeight: '750px',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.02)',
                                        backdropFilter: 'blur(16px)',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ 
                                            padding: '24px', 
                                            borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                                            color: 'white'
                                        }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Course Playlist</h3>
                                                <span style={{ fontSize: '12px', color: '#B0B3C6', fontWeight: 500 }}>{selectedSubject} lectures</span>
                                            </div>
                                            <span style={{ 
                                                fontSize: '12px', 
                                                color: '#FFFFFF', 
                                                fontWeight: 700, 
                                                background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)', 
                                                padding: '4px 10px', 
                                                borderRadius: '100px',
                                                boxShadow: '0 4px 10px rgba(229, 57, 53, 0.2)'
                                            }}>
                                                {subjectLectures.length} Videos
                                            </span>
                                        </div>

                                        <div className="playlist-scroll" style={{ overflowY: 'auto', flex: 1, background: '#F8F9FD' }}>
                                            {subjectDates.length === 0 ? (
                                                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#8F92A1', fontSize: '14px', fontWeight: 500 }}>
                                                    No recorded lectures available.
                                                </div>
                                            ) : (
                                                subjectDates.map(date => (
                                                    <div key={date}>
                                                        <div style={{ 
                                                            background: '#EEEFF4', 
                                                            padding: '10px 20px', 
                                                            fontSize: '11px', 
                                                            fontWeight: 700, 
                                                            color: '#5E6278', 
                                                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)', 
                                                            borderTop: '1px solid rgba(226, 232, 240, 0.6)', 
                                                            marginTop: '-1px', 
                                                            textTransform: 'uppercase', 
                                                            letterSpacing: '0.05em' 
                                                        }}>
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
                                                                            padding: '16px 20px', 
                                                                            borderBottom: '1px solid rgba(226, 232, 240, 0.5)', 
                                                                            cursor: 'pointer',
                                                                            background: isActive ? 'rgba(229, 57, 53, 0.06)' : '#FFFFFF',
                                                                            display: 'flex', 
                                                                            gap: '12px', 
                                                                            alignItems: 'flex-start',
                                                                            transition: 'all 0.2s ease',
                                                                            position: 'relative'
                                                                        }}
                                                                    >
                                                                        {isActive && (
                                                                            <div style={{
                                                                                position: 'absolute',
                                                                                left: 0,
                                                                                top: 0,
                                                                                bottom: 0,
                                                                                width: '4px',
                                                                                background: '#E53935'
                                                                            }} />
                                                                        )}

                                                                        <div style={{ 
                                                                            marginTop: '2px', 
                                                                            color: isActive ? '#E53935' : '#A1A5B7', 
                                                                            transition: 'color 0.2s' 
                                                                        }}>
                                                                            <PlayCircle size={18} fill={isActive ? 'rgba(229, 57, 53, 0.1)' : 'transparent'} />
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ 
                                                                                fontSize: '13px', 
                                                                                fontWeight: isActive ? 700 : 500, 
                                                                                color: isActive ? '#E53935' : '#1A1D3B', 
                                                                                lineHeight: '1.4', 
                                                                                marginBottom: '6px', 
                                                                                transition: 'color 0.2s' 
                                                                            }}>
                                                                                {lecture.title}
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8F92A1', fontWeight: 600 }}>
                                                                                <Clock size={11} /> {lecture.time}
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
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

