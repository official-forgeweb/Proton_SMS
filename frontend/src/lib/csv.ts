/**
 * Converts a JSON array to a CSV string.
 */
export function jsonToCsv(items: any[]): string {
    if (!items || !items.length) {
        return '';
    }

    const firstItem = items[0];
    const keys = Object.keys(firstItem);
    
    const headerRow = keys.map(key => `"${String(key).replace(/"/g, '""')}"`).join(',');
    
    const dataRows = items.map(item => {
        return keys.map(key => {
            const val = item[key];
            const escapedVal = val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '';
            return `"${escapedVal}"`;
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a browser download of the given CSV string.
 */
export function downloadCsv(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
