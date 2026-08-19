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
      if (status === 'pending') return 'Pending';
      if (status === 'submitted') {
        const completedDate = entry?.completedAt ? formatDate(entry.completedAt) : '';
        const submittedDate = entry?.updatedAt ? formatDate(entry.updatedAt) : '';
        return `Completed: ${completedDate}\nSubmitted: ${submittedDate}`;
      }
      const date = entry?.updatedAt ? formatDate(entry.updatedAt) : '';
      return `Completed\n${date}`;
    })
  ]);

  return { headers, rows };
}

export function exportPDF(course: Course) {
  const statuses = getStatuses().filter(s => s.courseId === course.id);
  const statusMap = new Map<string, StatusEntry>();
  statuses.forEach(s => statusMap.set(`${s.studentId}_${s.experimentId}`, s));

  const expCount = course.experiments.length;
  const doc = new jsPDF({ orientation: expCount > 4 ? 'landscape' : 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Keep columns per page limited so text stays large & legible on a phone (WhatsApp)
  const perPage = expCount > 4 ? 10 : expCount;
  const chunks: typeof course.experiments[] = [];
  for (let i = 0; i < expCount; i += perPage) {
    chunks.push(course.experiments.slice(i, i + perPage));
  }
  if (chunks.length === 0) chunks.push([]);

  const drawHeader = (partLabel: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 24, 39);
    doc.text("St. George's College Aruvithura", pageWidth / 2, 13, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Department of Computer Application', pageWidth / 2, 19, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(21, 94, 117);
    doc.text(`${course.code} — ${course.name}`, pageWidth / 2, 26, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Report Date: ${new Date().toLocaleDateString()}  |  Students: ${course.students.length}  |  Experiments: ${expCount}${partLabel}`,
      pageWidth / 2, 31, { align: 'center' }
    );
  };

  chunks.forEach((exps, chunkIdx) => {
    if (chunkIdx > 0) doc.addPage();
    drawHeader(chunks.length > 1 ? `  |  Part ${chunkIdx + 1} of ${chunks.length}` : '');

    const headers = [
      'Roll No',
      'Student Name',
      ...exps.map(e => e.shortCode + (e.title ? `\n${e.title}` : ''))
    ];

    const rows = course.students.map(student => [
      student.rollNumber,
      student.name,
      ...exps.map(exp => {
        const entry = statusMap.get(`${student.id}_${exp.id}`);
        const status = entry?.status || 'pending';
        if (status === 'pending') return 'Pending';
        if (status === 'submitted') {
          return `Completed: ${formatDate(entry?.completedAt)}\nSubmitted: ${formatDate(entry?.updatedAt)}`;
        }
        return `Completed\n${formatDate(entry?.updatedAt)}`;
      })
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 36,
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        overflow: 'linebreak',
        lineWidth: 0.2,
        lineColor: [203, 213, 225],
        textColor: [17, 24, 39],
        valign: 'middle',
      },
      headStyles: {
        fillColor: [15, 76, 129],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 38 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index >= 2) {
          const val = (data.cell.raw as string) || '';
          data.cell.styles.halign = 'center';
          if (val.startsWith('Completed:')) {
            // Submitted (both dates)
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = 'bold';
          } else if (val.startsWith('Completed')) {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [21, 105, 60];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [120, 128, 138];
          }
        }
      }
    });
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
