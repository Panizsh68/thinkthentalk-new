
function convertToCSV(data: any[], headers: Record<string, string>): string {
  const headerKeys = Object.keys(headers);
  const headerValues = Object.values(headers);

  const csvRows = [headerValues.join(',')];

  for (const row of data) {
    const values = headerKeys.map(key => {
      let value = row[key];
      if (value === null || value === undefined) {
        value = '';
      }
      // Escape commas and quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function exportToCsv(data: any[], headers: Record<string, string>, filename: string) {
  if (!data || data.length === 0) {
    return;
  }

  const csvString = convertToCSV(data, headers);
  
  // Add BOM for UTF-8 support in Excel
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

    