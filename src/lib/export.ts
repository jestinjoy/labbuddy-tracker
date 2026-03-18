import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Course, StatusEntry, ExperimentStatus } from './types';
import { getStatuses } from './store';

function getStatusLabel(status: ExperimentStatus): string {
  return status === 'pending' ? 'Pending' : status === 'completed' ? 'Completed' : 'Submitted';
}

function buildMatrix(course: Course) {
  const statuses = getStatuses().filter(s => s.courseId === course.id);
  const statusMap = new Map<string, ExperimentStatus>();
  statuses.forEach(s => {
    statusMap.set(`${s.studentId}_${s.experimentId}`, s.status);
  });

  const headers = ['Roll No', 'Student Name', ...course.experiments.map(e => e.shortCode)];
  const rows = course.students.map(student => [
    student.rollNumber,
    student.name,
    ...course.experiments.map(exp => {
      const status = statusMap.get(`${student.id}_${exp.id}`) || 'pending';
      return getStatusLabel(status);
    })
  ]);

  return { headers, rows };
}

export function exportPDF(course: Course) {
  const { headers, rows } = buildMatrix(course);
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? 'landscape' : 'portrait' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${course.code} — ${course.name}`, 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Students: ${course.students.length} | Experiments: ${course.experiments.length}`, 14, 34);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 122, 255], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const val = data.cell.raw as string;
        if (val === 'Completed') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Submitted') {
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
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, course.code);
  XLSX.writeFile(wb, `${course.code}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
