import { getCourses, saveCourses, getStatuses, saveStatuses } from './store';
import { Course, StatusEntry } from './types';

interface BackupData {
  version: 1;
  exportedAt: string;
  courses: Course[];
  statuses: StatusEntry[];
}

export function exportAllData() {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    courses: getCourses(),
    statuses: getStatuses(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `catalyst_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAllData(file: File): Promise<{ courses: number; statuses: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (!data.courses || !Array.isArray(data.courses)) {
          throw new Error('Invalid backup file');
        }
        // Merge: add courses that don't exist, update ones that do
        const existing = getCourses();
        const existingIds = new Set(existing.map(c => c.id));
        const newCourses = data.courses.filter(c => !existingIds.has(c.id));
        const merged = [...existing, ...newCourses];
        saveCourses(merged);

        // Merge statuses
        if (data.statuses) {
          const existingStatuses = getStatuses();
          const statusKeys = new Set(
            existingStatuses.map(s => `${s.courseId}_${s.studentId}_${s.experimentId}`)
          );
          const newStatuses = data.statuses.filter(
            s => !statusKeys.has(`${s.courseId}_${s.studentId}_${s.experimentId}`)
          );
          saveStatuses([...existingStatuses, ...newStatuses]);
          resolve({ courses: newCourses.length, statuses: newStatuses.length });
        } else {
          resolve({ courses: newCourses.length, statuses: 0 });
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
