'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { User, Phone, Mail, Award, BookOpen, ChevronLeft, Calendar, Briefcase, GraduationCap, Clock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TeacherProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [teacher, setTeacher] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            api.get(`/teachers/${params.id}`)
                .then(res => setTeacher(res.data.data))
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [params.id]);

    if (isLoading) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ padding: '80px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 20px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #f3f3f3', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid #E53935', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
                    </div>
                    <p style={{ color: '#1A1D3B', fontSize: '15px', fontWeight: 600 }}>Loading teacher profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!teacher) {
        return (
            <DashboardLayout requiredRole="admin">
                <div style={{ padding: '80px', textAlign: 'center', background: '#F8F9FD', borderRadius: '24px', margin: '24px' }}>
                    <User size={64} style={{ color: '#A1A5B7', marginBottom: '20px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '20px', color: '#1A1D3B', marginBottom: '12px', fontWeight: 800 }}>Teacher Not Found</h3>
                    <p style={{ fontSize: '15px', color: '#8F92A1', fontWeight: 500, marginBottom: '24px' }}>The teacher profile you're looking for doesn't exist or was removed.</p>
                    <button 
                        onClick={() => router.push('/admin/teachers')}
                        style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <ChevronLeft size={18} /> Go Back to Directory
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const name = `${teacher.first_name} ${teacher.last_name}`;

    return (
        <DashboardLayout requiredRole="admin">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                .glass-panel {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .bg-mesh {
                    background-color: #f7f8fc;
                    background-image: radial-gradient(at 40% 20%, hsla(28,100%,74%,0.15) 0px, transparent 50%),
                                      radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%),
                                      radial-gradient(at 0% 50%, hsla(355,100%,93%,0.15) 0px, transparent 50%);
                }
                .detail-row {
                    display: flex; align-items: flex-start; gap: 16px; padding: 16px;
                    border-radius: 16px; transition: all 0.2s;
                }
                .detail-row:hover {
                    background: #F8F9FD;
                }
                .class-item {
                    transition: all 0.2s;
                }
                .class-item:hover {
                    transform: translateX(6px);
                    background: #F8F9FD !important;
                    border-color: #E2E8F0 !important;
                }
            `}} />

            <div className="bg-mesh" style={{ padding: '32px', margin: '-24px', minHeight: '100%', borderRadius: '24px' }}>
                
                {/* Header Section */}
                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', animationDelay: '0ms' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=80&bold=true`}
                            style={{ width: '80px', height: '80px', borderRadius: '24px', border: '3px solid #FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                            alt={name}
                        />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                                    {name}
                                </h1>
                                <span style={{
                                    padding: '4px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                                    background: teacher.employment_status === 'active' ? '#ECFDF5' : '#F8F9FD',
                                    color: teacher.employment_status === 'active' ? '#059669' : '#8F92A1',
                                    boxShadow: teacher.employment_status === 'active' ? '0 2px 6px rgba(16,185,129,0.1)' : 'none'
                                }}>
                                    {teacher.employment_status}
                                </span>
                            </div>
                            <p style={{ fontSize: '15px', color: '#5E6278', fontWeight: 600, fontFamily: 'monospace', margin: 0, letterSpacing: '0.05em' }}>
                                EMP_ID: {teacher.employee_id} <span style={{ color: '#CBD5E1', margin: '0 8px' }}>|</span> Role: {teacher.role_type ? teacher.role_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Subject Teacher'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.push('/admin/teachers')}
                        style={{
                            background: '#FFFFFF', color: '#1A1D3B', border: '1px solid #E2E8F0',
                            borderRadius: '14px', padding: '10px 20px', fontSize: '14px',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                        onMouseEnter={e => { (e.currentTarget.style.background = '#F8F9FD'); (e.currentTarget.style.borderColor = '#1A1D3B'); }}
                        onMouseLeave={e => { (e.currentTarget.style.background = '#FFFFFF'); (e.currentTarget.style.borderColor = '#E2E8F0'); }}
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} /> Back
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    
                    {/* Left Column: Profile Details */}
                    <div className="animate-fade-in glass-panel" style={{ borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)', animationDelay: '100ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', marginBottom: '16px', borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53935' }}>
                                <User size={20} strokeWidth={2.5} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                Personal Information
                            </h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="detail-row">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F0F0F5' }}>
                                    <Phone size={16} color="#5E6278" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number</span>
                                    <span style={{ fontSize: '15px', color: '#1A1D3B', fontWeight: 600 }}>{teacher.phone || 'Not provided'}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F0F0F5' }}>
                                    <Mail size={16} color="#5E6278" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</span>
                                    <span style={{ fontSize: '15px', color: '#1A1D3B', fontWeight: 600 }}>{teacher.email || 'Not provided'}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F0F0F5' }}>
                                    <GraduationCap size={16} color="#5E6278" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Highest Qualification</span>
                                    <span style={{ fontSize: '15px', color: '#1A1D3B', fontWeight: 600 }}>{teacher.qualification || 'Not provided'}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F0F0F5' }}>
                                    <Award size={16} color="#5E6278" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject Specialization</span>
                                    <span style={{ fontSize: '15px', color: '#E53935', fontWeight: 700 }}>{teacher.specialization || 'Not specified'}</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F0F0F5' }}>
                                    <Briefcase size={16} color="#5E6278" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Experience</span>
                                    <span style={{ fontSize: '15px', color: '#1A1D3B', fontWeight: 600 }}>{teacher.experience_years || 0} Years</span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #F0F0F5' }}>
                                    <Calendar size={16} color="#5E6278" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date of Joining</span>
                                    <span style={{ fontSize: '15px', color: '#1A1D3B', fontWeight: 600 }}>{teacher.date_of_joining ? new Date(teacher.date_of_joining).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Assigned Classes & Schedule */}
                    <div className="animate-fade-in glass-panel" style={{ borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.04)', border: '1px solid rgba(255,255,255,0.8)', animationDelay: '200ms', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', marginBottom: '16px', borderBottom: '1px solid rgba(226,232,240,0.8)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0F5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                    <BookOpen size={20} strokeWidth={2.5} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', fontFamily: 'Poppins, sans-serif' }}>
                                    Assigned Classes
                                </h3>
                            </div>
                            <span style={{ background: '#F4F5F9', color: '#5E6278', padding: '6px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: 800 }}>
                                {teacher.classes?.length || 0} Total
                            </span>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {teacher.classes?.length > 0 ? (
                                teacher.classes.map((cls: any) => (
                                    <div key={cls.id} className="class-item" style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '16px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #F0F0F5',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F8F9FD', border: '1px solid #F0F0F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '10px', color: '#8F92A1', fontWeight: 800, textTransform: 'uppercase' }}>Class</span>
                                                <span style={{ fontSize: '14px', color: '#1A1D3B', fontWeight: 800 }}>{cls.class_name.replace('Class ', '')}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1A1D3B', margin: 0 }}>{cls.subject}</h4>
                                                <span style={{ fontSize: '13px', color: '#8F92A1', fontWeight: 500 }}>Grade Level: {cls.grade_level}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: '#A1A5B7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class Code</span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#3B82F6', fontWeight: 700, background: '#F0F5FF', padding: '4px 8px', borderRadius: '8px' }}>
                                                {cls.class_code}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '60px 40px', textAlign: 'center', background: '#F8F9FD', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                    <Clock size={48} style={{ color: '#A1A5B7', marginBottom: '16px', opacity: 0.4 }} />
                                    <h4 style={{ fontSize: '16px', color: '#1A1D3B', marginBottom: '8px', fontWeight: 700 }}>No Classes Assigned</h4>
                                    <p style={{ fontSize: '14px', color: '#8F92A1', fontWeight: 500, margin: 0 }}>This teacher is not currently assigned to any active classes or batches.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                </div>
            </div>
        </DashboardLayout>
    );
}
