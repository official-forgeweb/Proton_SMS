'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import TeacherStudentsClient from './TeacherStudentsClient';
import DashboardLayout from '@/components/DashboardLayout';
import PermissionGuard from '@/components/PermissionGuard';

export default function TeacherStudentsFallbackClient() {
    const [students, setStudents] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/students', { params: { search: '', limit: 20 } })
            .then(res => setStudents(res.data.data || []))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading || !students) {
        return (
            <PermissionGuard permissionKey="students">
                <DashboardLayout requiredRole="teacher">
                    <div className="page-header">
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>My Students</h1>
                            <div className="skeleton" style={{ width: '200px', height: '14px', marginTop: '6px' }} />
                        </div>
                    </div>
                    <div className="page-body">
                        <div className="card" style={{ padding: '24px' }}>
                            <div className="skeleton" style={{ width: '100%', height: '300px', borderRadius: '12px' }} />
                        </div>
                    </div>
                </DashboardLayout>
            </PermissionGuard>
        );
    }

    return <TeacherStudentsClient initialData={{ students }} />;
}
