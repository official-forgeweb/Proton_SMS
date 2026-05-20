const fs = require('fs');

const adminPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/admin/students/[id]/page.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// 1. Add MessageSquare to lucide-react imports
if (!adminContent.includes('MessageSquare')) {
    adminContent = adminContent.replace(/import \{\n([^}]+)\n\} from 'lucide-react';/s, (match, p1) => {
        return `import {\n    MessageSquare,\n${p1}\n} from 'lucide-react';`;
    });
}

// 2. Add State for queries
if (!adminContent.includes('const [queries, setQueries]')) {
    adminContent = adminContent.replace('const [feeInfo, setFeeInfo] = useState<any>(null);', 
                                        'const [feeInfo, setFeeInfo] = useState<any>(null);\n    const [queries, setQueries] = useState<any[]>([]);');
}

// 3. Update fetchExtraReports
if (!adminContent.includes('api.get(`/queries`')) {
    adminContent = adminContent.replace(
`            const [attRes, testRes, feeRes, perfRes, hwRes] = await Promise.allSettled([
                api.get(\`/students/\${params.id}/attendance\`),
                api.get(\`/students/\${params.id}/tests\`),
                api.get(\`/students/\${params.id}/fees\`),
                api.get(\`/students/\${params.id}/performance\`),
                api.get(\`/students/\${params.id}/homework-history\`)
            ]);`,
`            const [attRes, testRes, feeRes, perfRes, hwRes, queriesRes] = await Promise.allSettled([
                api.get(\`/students/\${params.id}/attendance\`),
                api.get(\`/students/\${params.id}/tests\`),
                api.get(\`/students/\${params.id}/fees\`),
                api.get(\`/students/\${params.id}/performance\`),
                api.get(\`/students/\${params.id}/homework-history\`),
                api.get(\`/queries\`, { params: { student_id: params.id } })
            ]);`);

    adminContent = adminContent.replace(
        `if (hwRes.status === 'fulfilled') setHomeworkHistory(hwRes.value.data.data);`,
        `if (hwRes.status === 'fulfilled') setHomeworkHistory(hwRes.value.data.data);\n            if (queriesRes && queriesRes.status === 'fulfilled') setQueries(queriesRes.value.data.data || []);`
    );
}

// 4. Add the tab
if (!adminContent.includes("{ id: 'enquiries', label: 'Enquiries'")) {
    adminContent = adminContent.replace(
`        { id: 'fees', label: 'Fees', icon: <DollarSign size={16} /> },`,
`        { id: 'fees', label: 'Fees', icon: <DollarSign size={16} /> },\n        { id: 'enquiries', label: 'Enquiries', icon: <MessageSquare size={16} /> },`
    );
}

// 5. Add the Enquiries UI block
const enquiriesBlock = `
                {/* ENQUIRIES TAB */}
                {activeTab === 'enquiries' && (
                    <div className="animate-in" style={{ animationDelay: '220ms' }}>
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(229, 57, 53, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1D3B', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MessageSquare size={24} color="#E53935" />
                                    Student Enquiries
                                </h3>
                                <div style={{ background: '#F8F9FD', padding: '6px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#1A1D3B' }}>
                                    Total Records: {queries.length}
                                </div>
                            </div>

                            {queries.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {queries.map((q: any) => (
                                        <div key={q.id} style={{
                                            padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0',
                                            background: '#FCFDFE', display: 'flex', flexDirection: 'column', gap: '12px',
                                            transition: 'transform 0.2s ease, border-color 0.2s ease', cursor: 'default'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '16px', color: '#1E293B', textTransform: 'capitalize' }}>
                                                        {q.query_type.replace(/_/g, ' ')}
                                                    </span>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                                        background: q.status === 'resolved' ? '#ECFDF5' : q.status === 'processing' ? '#EFF6FF' : q.status === 'unresolved' ? '#FEF2F2' : '#F8F9FD',
                                                        color: q.status === 'resolved' ? '#059669' : q.status === 'processing' ? '#3B82F6' : q.status === 'unresolved' ? '#DC2626' : '#64748B',
                                                        border: \`1px solid \${q.status === 'resolved' ? '#A7F3D0' : q.status === 'processing' ? '#BFDBFE' : q.status === 'unresolved' ? '#FECACA' : '#E2E8F0'}\`
                                                    }}>
                                                        {q.status}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8F92A1' }}>
                                                    {new Date(q.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                            </div>

                                            {q.description && (
                                                <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', background: '#F1F5F9', padding: '12px 16px', borderRadius: '12px' }}>
                                                    {q.description}
                                                </div>
                                            )}

                                            {q.resolution_note && (
                                                <div style={{ marginTop: '4px', fontSize: '13px', color: '#059669', background: 'rgba(5, 150, 105, 0.06)', padding: '10px 14px', borderRadius: '10px', borderLeft: '3px solid #059669' }}>
                                                    <strong style={{ fontWeight: 700, marginRight: '6px' }}>Resolution:</strong>
                                                    {q.resolution_note}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 40px', background: '#F8F9FD', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', marginBottom: '16px' }}>
                                        <MessageSquare size={28} color="#94A3B8" />
                                    </div>
                                    <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#1A1D3B', margin: '0 0 6px 0' }}>No Enquiries Found</h5>
                                    <p style={{ color: '#8F92A1', fontSize: '13px', fontWeight: 600, margin: 0 }}>This student hasn't made any enquiries yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
`;

if (!adminContent.includes("activeTab === 'enquiries'")) {
    adminContent = adminContent.replace(
        '            </div>\n        </DashboardLayout>',
        enquiriesBlock + '\n            </div>\n        </DashboardLayout>'
    );
}
fs.writeFileSync(adminPath, adminContent);
console.log("Admin page updated successfully.");
