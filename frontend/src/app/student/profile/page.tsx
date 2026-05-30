'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Phone, Building, Shield, Calendar, Users } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function StudentProfilePage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/dashboard/student');
                setData(res.data.data);
            } catch (err) {
                toast.error('Failed to load profile details');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const student = data?.student;
    const currentClass = data?.classes?.[0];
    const parent = data?.parents;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <DashboardLayout requiredRole="student">
            <div style={{ paddingBottom: '120px' }}>
                {/* Header */}
                <div className="page-header" style={{ marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1D3B', letterSpacing: '-0.02em', margin: 0 }}>
                            My Profile
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '6px', fontWeight: 500 }}>
                            Manage your personal details, academic metrics, and account credentials.
                        </p>
                    </div>
                </div>

                <div className="page-body">
                    {isLoading ? (
                        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <div style={{ height: '380px', borderRadius: '24px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(226, 232, 240, 0.8)' }} className="animate-fade-in" />
                        </div>
                    ) : (
                        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Card Wrapper */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                backdropFilter: 'blur(16px)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Immersive Top Mesh Gradient */}
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #1A1D3B 0%, #0D0F21 100%)', 
                                    height: '140px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '-40px', 
                                        right: '-40px', 
                                        width: '180px', 
                                        height: '180px', 
                                        borderRadius: '50%', 
                                        background: 'rgba(229, 57, 53, 0.1)', 
                                        filter: 'blur(40px)' 
                                    }} />
                                </div>

                                <div style={{ padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                    {/* Avatar */}
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '-55px', 
                                        left: '32px',
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '24px',
                                        background: 'linear-gradient(135deg, #E53935 0%, #B71C1C 100%)',
                                        border: '4px solid white', 
                                        boxShadow: '0 8px 24px rgba(229, 57, 53, 0.18)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: '32px',
                                        fontWeight: 800
                                    }}>
                                        {student?.first_name?.[0]}{student?.last_name?.[0]}
                                    </div>

                                    {/* User General Title */}
                                    <div style={{ marginTop: '45px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                        <div>
                                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1D3B', margin: 0 }}>
                                                {student?.first_name} {student?.last_name}
                                            </h2>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ 
                                                    padding: '4px 12px', 
                                                    borderRadius: '50px', 
                                                    fontSize: '11px', 
                                                    fontWeight: 800, 
                                                    background: '#E6F4EA', 
                                                    color: '#137333',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em'
                                                }}>
                                                    {student?.enrollment_status || 'Active'}
                                                </span>
                                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                                                    • ID: {student?.PRO_ID}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

                                    {/* Detailed Student Parameters Grid */}
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                            <Building size={18} color="#E53935" /> Academic Information
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Class</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px' }}>
                                                    {currentClass?.class_name || 'N/A'}
                                                </div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section / Stream</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px' }}>
                                                    {currentClass?.section || 'A'} {currentClass?.stream ? `• ${currentClass.stream}` : ''}
                                                </div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Clearance</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Shield size={16} color="#E53935" /> Student Portal
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

                                    {/* Personal details */}
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                            <User size={18} color="#E53935" /> Personal Details
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-all' }}>
                                                    <Mail size={15} color="#64748B" /> {student?.email || 'N/A'}
                                                </div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Phone</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Phone size={15} color="#64748B" /> {student?.phone || 'N/A'}
                                                </div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={15} color="#64748B" /> {formatDate(student?.dob)}
                                                </div>
                                            </div>
                                            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px', textTransform: 'capitalize' }}>
                                                    {student?.gender || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {parent && (
                                        <>
                                            <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '32px 0' }} />

                                            {/* Parents contact info */}
                                            <div>
                                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A1D3B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                                    <Users size={18} color="#E53935" /> Guardian Details
                                                </h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                                    <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Father's Name</div>
                                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px' }}>
                                                            {parent.father_name || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mother's Name</div>
                                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px' }}>
                                                            {parent.mother_name || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
                                                        <div style={{ fontSize: '11px', color: '#8F92A1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian Phone</div>
                                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Phone size={15} color="#64748B" /> {parent.phone || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
