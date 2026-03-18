import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses } from '@/lib/store';
import { Course } from '@/lib/types';
import { CourseCard } from '@/components/CourseCard';
import { exportAllData, importAllData } from '@/lib/backup';
import { Plus, FlaskConical, Download, Upload } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importAllData(file);
      setImportMsg(`Imported ${result.courses} course(s), ${result.statuses} status(es)`);
      setCourses(getCourses());
      setTimeout(() => setImportMsg(''), 3000);
    } catch {
      setImportMsg('Invalid backup file');
      setTimeout(() => setImportMsg(''), 3000);
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={18} className="text-primary" />
            <h1 className="font-mono-display text-lg font-bold tracking-tight text-foreground">
              CATALYST
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={exportAllData} className="p-2 text-muted-foreground hover:text-foreground" title="Export All Data">
              <Download size={18} />
            </button>
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <button onClick={() => importRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground" title="Import Data">
              <Upload size={18} />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {courses.length} course{courses.length !== 1 ? 's' : ''} · Lab Experiment Tracker
        </p>
        {importMsg && (
          <p className="text-xs text-primary mt-1 font-medium">{importMsg}</p>
        )}
      </div>

      {/* Course List */}
      <div className="flex-1 p-4">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FlaskConical size={40} className="mb-4 opacity-30" />
            <p className="text-sm mb-1">No courses yet</p>
            <p className="text-xs">Create your first course to get started</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/create')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded flex items-center justify-center shadow-lg shadow-primary/25 cell-transition active:scale-95"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
