'use client';
import { ReactNode } from 'react';

export interface TableColumn<T = any> {
    key: string;
    header: string;
    render?: (row: T, index: number) => ReactNode;
    style?: React.CSSProperties;
}

interface ResponsiveTableProps<T = any> {
    columns: TableColumn<T>[];
    data: T[];
    emptyMessage?: string;
    cardTitleKey?: string; // Column key to use as the mobile card header title
    rowKey?: (row: T, index: number) => string | number;
}

export default function ResponsiveTable({
    columns,
    data,
    emptyMessage = 'No data available.',
    cardTitleKey,
    rowKey = (row: any, idx: number) => row.id || idx
}: ResponsiveTableProps) {
    if (!data || data.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#A1A5B7',
                fontSize: '14px',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px dashed #E4E6EF'
            }}>
                {emptyMessage}
            </div>
        );
    }

    // Identify which column matches the cardTitleKey
    const titleColumn = cardTitleKey ? columns.find(c => c.key === cardTitleKey) : null;

    return (
        <div className="responsive-table-wrapper" style={{ width: '100%' }}>
            {/* Desktop Table View */}
            <div className="desktop-table-container">
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #EEEEF5' }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        textAlign: 'left',
                                        padding: '16px 20px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: '#8F92A1',
                                        letterSpacing: '0.05em',
                                        background: '#F8F9FD',
                                        ...col.style
                                    }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr
                                key={rowKey(row, rowIdx)}
                                className="table-row-hover"
                                style={{
                                    borderBottom: '1px solid #EEEEF5',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        style={{
                                            padding: '16px 20px',
                                            fontSize: '14px',
                                            color: '#1A1D3B',
                                            fontWeight: 500,
                                            verticalAlign: 'middle',
                                            ...col.style
                                        }}
                                    >
                                        {col.render ? col.render(row, rowIdx) : (row as any)[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="mobile-cards-container">
                {data.map((row, rowIdx) => {
                    const titleVal = titleColumn 
                        ? (titleColumn.render ? titleColumn.render(row, rowIdx) : (row as any)[titleColumn.key])
                        : `Record #${rowIdx + 1}`;

                    return (
                        <div
                            key={rowKey(row, rowIdx)}
                            className="mobile-stacked-card"
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #EEEEF5',
                                borderRadius: '16px',
                                padding: '16px',
                                marginBottom: '16px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.015)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}
                        >
                            {/* Card Header (Title Key value) */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F8F9FD',
                                paddingBottom: '10px',
                                marginBottom: '4px'
                            }}>
                                <span style={{
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    color: '#1A1D3B'
                                }}>
                                    {titleVal}
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#8F92A1',
                                    background: '#F1F2F6',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                }}>
                                    #{rowIdx + 1}
                                </span>
                            </div>

                            {/* Card Attributes */}
                            {columns
                                .filter(col => col.key !== cardTitleKey)
                                .map((col) => {
                                    const renderedVal = col.render 
                                        ? col.render(row, rowIdx) 
                                        : (row as any)[col.key];

                                    return (
                                        <div
                                            key={col.key}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '13px',
                                                padding: '4px 0'
                                            }}
                                        >
                                            <span style={{
                                                fontWeight: 700,
                                                color: '#5E6278',
                                                fontSize: '12px'
                                            }}>
                                                {col.header}
                                            </span>
                                            <span style={{
                                                fontWeight: 500,
                                                color: '#1A1D3B',
                                                textAlign: 'right'
                                            }}>
                                                {renderedVal}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                .table-row-hover:hover {
                    background-color: #F8F9FD !important;
                }
                .mobile-cards-container {
                    display: none;
                }
                @media (max-width: 768px) {
                    .desktop-table-container {
                        display: none !important;
                    }
                    .mobile-cards-container {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                }
            `}</style>
        </div>
    );
}
