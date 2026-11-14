import { ContentItem } from '../types';

/**
 * Exports content items to a CSV file compatible with Meta Business Suite bulk publishing
 * and spreadsheet analytics.
 */
export function exportContentToCSV(items: ContentItem[], filename = 'cropsa-marketing-schedule.csv') {
  if (!items || items.length === 0) {
    alert('No content items available to export.');
    return;
  }

  // Meta CSV standard headers + Cropsa campaign fields
  const headers = [
    'Title',
    'Platforms',
    'Content Type',
    'Due Date',
    'Publish Date',
    'Status',
    'Approval Status',
    'Priority',
    'Objective',
    'Caption',
    'Description',
    'Media URL',
    'Assigned To',
    'Tasks Count',
    'Completed Tasks'
  ];

  const escapeCSV = (str: string | undefined | null) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = items.map(item => {
    const totalTasks = item.tasks ? item.tasks.length : 0;
    const completedTasks = item.tasks ? item.tasks.filter(t => t.completed).length : 0;

    return [
      escapeCSV(item.title),
      escapeCSV(item.platforms ? item.platforms.join(', ') : ''),
      escapeCSV(item.type),
      escapeCSV(item.dueDate),
      escapeCSV(item.publishDate || ''),
      escapeCSV(item.status),
      escapeCSV(item.approvalStatus),
      escapeCSV(item.priority),
      escapeCSV(item.objective || ''),
      escapeCSV(item.caption),
      escapeCSV(item.description || item.details || ''),
      escapeCSV(item.mediaUrl || ''),
      escapeCSV(item.assignedTo ? item.assignedTo.join(', ') : ''),
      totalTasks,
      completedTasks
    ].join(',');
  });

  // Add UTF-8 BOM so Arabic displays correctly in Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export campaign items as JSON backup
 */
export function exportContentToJSON(items: ContentItem[], filename = 'cropsa-campaigns-backup.json') {
  const jsonContent = JSON.stringify(items, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
