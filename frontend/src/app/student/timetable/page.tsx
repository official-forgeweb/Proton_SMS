'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Calendar, Clock, MapPin, User, ChevronRight, AlertCircle } from 'lucide-react';

export default function StudentTimetablePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [rawTimetable, setRawTimetable] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        subject: '',
        class_name: '',
        timeFilter: 'all'
    });

    const fetchTimetable = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/timetable');
            setRawTimetable(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable();
    }, []);

    const subjects = Array.from(new Set(rawTimetable.map(t => t.subject))).filter(Boolean) as string[];
    const classNames = Array.from(new Set(rawTimetable.map(t => t.class_ref?.class_name))).filter(Boolean) as string[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const timetable = rawTimetable.filter(item => {
        if (filters.subject && item.subject !== filters.subject) return false;
        if (filters.class_name && item.class_ref?.class_name !== filters.class_name) return false;

        if (filters.timeFilter !== 'all') {
            const [year, month, day] = item.date.split('-').map(Number);
            const itemDate = new Date(year, month - 1, day);
            if (filters.timeFilter === 'today') {
                if (itemDate.getTime() !== today.getTime()) return false;
            } else if (filters.timeFilter === 'yesterday') {
                if (itemDate.getTime() !== yesterday.getTime()) return false;
            } else if (filters.timeFilter === 'this_week') {
                if (itemDate < startOfWeek || itemDate > endOfWeek) return false;
            }
        }
        return true;
    });

    // Helper to group by date
    const groupedTimetable = timetable.reduce((acc: any, curr: any) => {
        const date = curr.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(curr);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedTimetable).sort();

    return (
        <DashboardLayout requiredRole="student">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B' }}>My Class Schedule</h1>
                <p style={{ color: '#5E6278', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                    Showing schedule for your enrolled classes and subjects.
                </p>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Subject</label>
                            <select 
                                value={filters.subject}
                                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Class</label>
                            <select 
                                value={filters.class_name}
                                onChange={(e) => setFilters({ ...filters, class_name: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                            >
                                <option value="">All Classes</option>
                                {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8F92A1', display: 'block', marginBottom: '8px' }}>Time Period</label>
                            <select 
                                value={filters.timeFilter}
                                onChange={(e) => setFilters({ ...filters, timeFilter: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', outline: 'none' }}
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                            </select>
                        </div>
                    </div>
                </div>
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />)}
                    </div>
                ) : timetable.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Calendar size={40} color="#A1A5B7" />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1D3B' }}>No Upcoming Classes</h3>
                        <p style={{ color: '#5E6278', maxWidth: '400px', margin: '12px auto 0' }}>
                            You don't have any classes scheduled for your enrolled subjects at this time.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {sortedDates.map((date) => {
                            const dateObj = new Date(date);
                            const items = groupedTimetable[date];
                            
                            return (
                                <div key={date}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{ padding: '8px 16px', borderRadius: '12px', background: '#10121B', color: '#FFFFFF', fontSize: '14px', fontWeight: 700 }}>
                                            {dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </div>
                                        <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                                    </div>
                                    
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {items.map((entry: any) => (
                                            <div key={entry.id} className="card hover-lift" style={{ 
                                                padding: '24px', 
                                                borderRadius: '20px', 
                                                background: '#FFFFFF', 
                                                border: '1px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderLeft: '5px solid #E53935'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                    <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B' }}>{entry.start_time}</div>
                                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#A1A5B7', marginTop: '2px' }}>{entry.end_time}</div>
                                                    </div>
                                                    
                                                    <div style={{ width: '1px', height: '40px', background: '#E2E8F0' }} />
                                                    
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>{entry.subject}</h3>
                                                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#F8F9FD', border: '1px solid #E2E8F0', color: '#5E6278', fontWeight: 700 }}>{entry.class_ref?.class_name}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                                            <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <User size={14} color="#A1A5B7" /> {entry.teacher ? `${entry.teacher.first_name} ${entry.teacher.last_name}` : 'TBA'}
                                                            </span>
                                                            <span style={{ fontSize: '13px', color: '#5E6278', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <MapPin size={14} color="#A1A5B7" /> {entry.room || 'Online'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ padding: '10px', borderRadius: '12px', background: '#FFF5F5', color: '#E53935' }}>
                                                    <ChevronRight size={20} strokeWidth={2.5} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
