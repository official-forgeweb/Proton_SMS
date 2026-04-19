'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { 
    GraduationCap, DollarSign, Users, BookOpen, Clock, 
    Search, Filter, ArrowLeft 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminActivityPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await api.get('/dashboard/admin');
                const data = res.data.data;
                // For a more comprehensive list, we'd ideally have a separate endpoint, 
                // but we'll use the dash data for now or mock more if needed.
                setActivities(data.recent_activity || []);
            } catch (error) {
                console.error('Error fetching activity:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchActivity();
    }, []);

    const filteredActivities = activities.filter(a => {
        const matchesSearch = a.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || a.type === filter;
        return matchesSearch && matchesFilter;
    });

    const getActivityConfig = (type: string) => {
        switch (type) {
            case 'enrollment': return { icon: GraduationCap, bg: '#FFEBEE', color: '#E53935' };
            case 'payment': return { icon: DollarSign, bg: '#D1FAE5', color: '#10B981' };
            case 'enquiry': return { icon: Users, bg: '#FFF3E0', color: '#F97316' };
            default: return { icon: BookOpen, bg: '#F4F5F9', color: '#5E6278' };
        }
    };

    return (
        <DashboardLayout requiredRole="admin">
            <div style={{ paddingBottom: '32px' }}>
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={() => router.back()}
                        style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: '#FFFFFF', border: '1px solid #E4E6EF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#5E6278'
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B' }}>System Activity Logs</h1>
                        <p style={{ fontSize: '14px', color: '#A1A5B7', marginTop: '4px' }}>Real-time track of all institutional updates</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', borderRadius: '20px', background: '#FFFFFF', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Search */}
                        <div style={{ 
                            flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', 
                            background: '#F4F5F9', borderRadius: '12px', padding: '0 16px',
                            border: '1px solid #E4E6EF'
                        }}>
                            <Search size={18} color="#A1A5B7" />
                            <input 
                                placeholder="Search activity..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    border: 'none', background: 'transparent', padding: '12px',
                                    outline: 'none', color: '#1A1D3B', flex: 1, fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* Filter */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['all', 'enrollment', 'payment', 'enquiry'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: '10px 20px', borderRadius: '12px',
                                        border: filter === f ? 'none' : '1px solid #E4E6EF',
                                        background: filter === f ? '#E53935' : '#FFFFFF',
                                        color: filter === f ? '#FFFFFF' : '#5E6278',
                                        fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                        textTransform: 'capitalize', transition: 'all 0.2s'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', padding: '0px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-fade-in glass-panel" style={{ height: '140px', borderRadius: '16px', animationDelay: `${i * 100}ms`, border: '1px solid rgba(226, 232, 240, 0.8)', background: '#F8F9FD' }} />
                            ))}
                        </div>
                    ) :  (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredActivities.length > 0 ? filteredActivities.map((activity, i) => {
                            const config = getActivityConfig(activity.type);
                            const Icon = config.icon;
                            return (
                                <div key={i} className="card hover-lift" style={{ 
                                    padding: '20px', borderRadius: '18px', display: 'flex', gap: '20px', 
                                    alignItems: 'center', background: '#FFFFFF', border: '1px solid #F0F0F5' 
                                }}>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '16px',
                                        background: config.bg, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', color: config.color, flexShrink: 0
                                    }}>
                                        <Icon size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <h4 style={{ fontWeight: 700, fontSize: '15px', color: '#1A1D3B', textTransform: 'capitalize' }}>
                                                {activity.type}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A1A5B7', fontSize: '12px' }}>
                                                <Clock size={12} />
                                                {new Date(activity.time).toLocaleString()}
                                            </div>
                                        </div>
                                        <p style={{ color: '#5E6278', fontSize: '14px', lineHeight: 1.5 }}>{activity.message}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="card" style={{ textAlign: 'center', padding: '60px', borderRadius: '20px' }}>
                                <Clock size={48} color="#A1A5B7" style={{ display: 'block', margin: '0 auto 16px auto' }} />
                                <h3 style={{ color: '#1A1D3B' }}>No activity found</h3>
                                <p style={{ color: '#A1A5B7' }}>Try adjusting your search or filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
