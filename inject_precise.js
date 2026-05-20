const fs = require('fs');

function processAdmin() {
    const p = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/admin/students/[id]/page.tsx';
    let lines = fs.readFileSync(p, 'utf8').split('\n');
    
    // 1. Add MessageSquare to imports
    let lucideIndex = lines.findIndex(l => l.includes("from 'lucide-react'"));
    if (lucideIndex !== -1) {
        if (!lines[lucideIndex - 1].includes('MessageSquare')) {
            lines[lucideIndex - 1] = lines[lucideIndex - 1].replace('Trophy', 'Trophy, MessageSquare');
        }
    }

    // 2. Add queries state
    let feeInfoIndex = lines.findIndex(l => l.includes('const [feeInfo, setFeeInfo]'));
    if (feeInfoIndex !== -1 && !lines.join('\n').includes('const [queries, setQueries]')) {
        lines.splice(feeInfoIndex + 1, 0, "    const [queries, setQueries] = useState<any[]>([]);");
    }

    // 3. Update fetchExtraReports
    let promiseIndex = lines.findIndex(l => l.includes('const [attRes, testRes, feeRes, perfRes, hwRes] = await Promise.allSettled(['));
    if (promiseIndex !== -1) {
        lines[promiseIndex] = "            const [attRes, testRes, feeRes, perfRes, hwRes, queriesRes] = await Promise.allSettled([";
        let bracketIndex = lines.indexOf("            ]);", promiseIndex);
        if (bracketIndex !== -1 && !lines[bracketIndex - 1].includes('/queries')) {
            lines[bracketIndex - 1] += ',';
            lines.splice(bracketIndex, 0, "                api.get(`/queries`, { params: { student_id: params.id } })");
        }
        
        let hwResIndex = lines.findIndex(l => l.includes("if (hwRes.status === 'fulfilled')"));
        if (hwResIndex !== -1 && !lines[hwResIndex+1].includes('setQueries')) {
            lines.splice(hwResIndex + 1, 0, "            if (queriesRes && queriesRes.status === 'fulfilled') setQueries(queriesRes.value.data.data || []);");
        }
    }

    // 4. Add tab
    let feesTabIndex = lines.findIndex(l => l.includes("{ id: 'fees', label: 'Fees'"));
    if (feesTabIndex !== -1 && !lines[feesTabIndex+1].includes('enquiries')) {
        lines.splice(feesTabIndex + 1, 0, "        { id: 'enquiries', label: 'Enquiries', icon: <MessageSquare size={16} /> },");
    }

    // 5. Add Enquiries UI block
    let endDivIndex = lines.lastIndexOf('            </div>');
    let endDashboardIndex = lines.lastIndexOf('        </DashboardLayout>');
    if (endDashboardIndex > 0 && !lines.join('\n').includes("activeTab === 'enquiries'")) {
        const block = `
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
                                        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                        onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
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
                )}`;
        lines.splice(endDivIndex, 0, block);
    }
    fs.writeFileSync(p, lines.join('\n'));
}

function processTeacher() {
    const p = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/teacher/students/[id]/page.tsx';
    let lines = fs.readFileSync(p, 'utf8').split('\n');

    // 1. Add MessageSquare to imports
    let lucideIndex = lines.findIndex(l => l.includes("from 'lucide-react'"));
    if (lucideIndex !== -1) {
        if (!lines[lucideIndex - 1].includes('MessageSquare')) {
            lines[lucideIndex - 1] = lines[lucideIndex - 1].replace('Info', 'Info, MessageSquare');
        }
    }

    // 2. Add queries state
    let hwHistoryIndex = lines.findIndex(l => l.includes('const [homeworkHistory, setHomeworkHistory]'));
    if (hwHistoryIndex !== -1 && !lines.join('\n').includes('const [queries, setQueries]')) {
        lines.splice(hwHistoryIndex + 1, 0, "    const [queries, setQueries] = useState<any[]>([]);");
    }

    // 3. Update fetchExtraReports
    let promiseIndex = lines.findIndex(l => l.includes('const [attRes, testRes, perfRes, hwRes, remarksRes] = await Promise.allSettled(['));
    if (promiseIndex !== -1) {
        lines[promiseIndex] = "        const [attRes, testRes, perfRes, hwRes, remarksRes, queriesRes] = await Promise.allSettled([";
        let bracketIndex = lines.indexOf("        ]);", promiseIndex);
        if (bracketIndex !== -1 && !lines[bracketIndex - 1].includes('/queries')) {
            lines[bracketIndex - 1] += ',';
            lines.splice(bracketIndex, 0, "            api.get(`/queries`, { params: { student_id: params.id } })");
        }
        
        let hwResIndex = lines.findIndex(l => l.includes("if (hwRes.status === 'fulfilled')"));
        if (hwResIndex !== -1 && !lines.join('\n').includes("if (queriesRes && queriesRes.status === 'fulfilled')")) {
            lines.splice(hwResIndex + 1, 0, "        if (queriesRes && queriesRes.status === 'fulfilled') setQueries(queriesRes.value.data.data || []);");
        }
    }

    // 4. Add tab
    let attTabIndex = lines.findIndex(l => l.includes("{ id: 'attendance', label: 'Attendance'"));
    if (attTabIndex !== -1 && !lines[attTabIndex+1].includes('enquiries')) {
        lines.splice(attTabIndex + 1, 0, "        { id: 'enquiries', label: 'Enquiries', icon: <MessageSquare size={16} /> },");
    }

    // 5. Add Enquiries UI block
    let endDivIndex = lines.lastIndexOf('            </div>');
    let endDashboardIndex = lines.lastIndexOf('        </DashboardLayout>');
    if (endDashboardIndex > 0 && !lines.join('\n').includes("activeTab === 'enquiries'")) {
        const block = `
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
                                        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                        onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
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
                )}`;
        lines.splice(endDivIndex, 0, block);
    }
    fs.writeFileSync(p, lines.join('\n'));
}

processAdmin();
processTeacher();
console.log('Update script executed cleanly line by line.');
