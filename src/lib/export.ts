import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Course, StatusEntry, ExperimentStatus } from './types';
import { getStatuses } from './store';

function getStatusLabel(status: ExperimentStatus): string {
  return status === 'pending' ? 'Pending' : status === 'completed' ? 'Completed' : 'Submitted';
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function buildMatrix(course: Course) {
  const statuses = getStatuses().filter(s => s.courseId === course.id);
  const statusMap = new Map<string, StatusEntry>();
  statuses.forEach(s => {
    statusMap.set(`${s.studentId}_${s.experimentId}`, s);
  });

  const headers = ['Roll No', 'Student Name', ...course.experiments.map(e => e.shortCode)];
  const rows = course.students.map(student => [
    student.rollNumber,
    student.name,
    ...course.experiments.map(exp => {
      const entry = statusMap.get(`${student.id}_${exp.id}`);
      const status = entry?.status || 'pending';
      const label = getStatusLabel(status);
      if (status === 'pending') return label;
      if (status === 'submitted') {
        const completedDate = entry?.completedAt ? formatDate(entry.completedAt) : '';
        const submittedDate = entry?.updatedAt ? formatDate(entry.updatedAt) : '';
        return `Done: ${completedDate}\nSub: ${submittedDate}`;
      }
      const date = entry?.updatedAt ? formatDate(entry.updatedAt) : '';
      return `${label}\n${date}`;
    })
  ]);

  return { headers, rows };
}

export function exportPDF(course: Course) {
  const { headers, rows } = buildMatrix(course);
  const expCount = course.experiments.length;
  // Always landscape for many experiments
  const doc = new jsPDF({ orientation: expCount > 5 ? 'landscape' : 'portrait' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${course.code} — ${course.name}`, 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Students: ${course.students.length}  |  Experiments: ${expCount}`, 14, 22);

  // Dynamic font sizing based on experiment count
  const fontSize = expCount > 15 ? 5 : expCount > 10 ? 6 : expCount > 6 ? 7 : 8;
  const cellPadding = expCount > 15 ? 1.5 : expCount > 10 ? 2 : 3;

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize, cellPadding, overflow: 'linebreak', lineWidth: 0.1 },
    headStyles: { fillColor: [0, 122, 255], textColor: 255, fontSize: Math.max(fontSize, 5), halign: 'center' },
    columnStyles: {
      0: { cellWidth: expCount > 15 ? 14 : 20, halign: 'center' },
      1: { cellWidth: expCount > 15 ? 25 : 35 },
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const val = (data.cell.raw as string) || '';
        data.cell.styles.halign = 'center';
        if (val.startsWith('Completed')) {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (val.startsWith('Submitted')) {
          data.cell.styles.textColor = [245, 158, 11];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [150, 150, 150];
        }
      }
    }
  });

  doc.save(`${course.code}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportExcel(course: Course) {
  const { headers, rows } = buildMatrix(course);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Set column widths
  ws['!cols'] = [{ wch: 10 }, { wch: 20 }, ...course.experiments.map(() => ({ wch: 16 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, course.code);
  XLSX.writeFile(wb, `${course.code}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
