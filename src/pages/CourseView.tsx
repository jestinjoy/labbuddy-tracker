import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, updateCourse, getStatuses, setStatus, deleteCourse } from '@/lib/store';
import { ExperimentStatus, nextStatus, StatusEntry, Student, Experiment } from '@/lib/types';
import { StatusCell } from '@/components/StatusCell';
import { exportPDF, exportExcel } from '@/lib/export';
import { ArrowLeft, FileDown, FileSpreadsheet, Trash2, Plus, UserPlus, FlaskConical, Settings } from 'lucide-react';
import { BulkStudentUpload } from '@/components/BulkStudentUpload';
import { v4 as uuid } from 'uuid';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState(() => getCourse(id!));
  const [statusMap, setStatusMap] = useState<Map<string, ExperimentStatus>>(() => {
    const map = new Map<string, ExperimentStatus>();
    getStatuses().filter(s => s.courseId === id).forEach(s => {
      map.set(`${s.studentId}_${s.experimentId}`, s.status);
    });
    return map;
  });

  const [showManage, setShowManage] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');

  const stats = useMemo(() => {
    if (!course) return { total: 0, pending: 0, completed: 0, submitted: 0 };
    const total = course.students.length * course.experiments.length;
    let completed = 0, submitted = 0;
    statusMap.forEach(v => {
      if (v === 'completed') completed++;
      if (v === 'submitted') submitted++;
    });
    return { total, pending: total - completed - submitted, completed, submitted };
  }, [statusMap, course]);

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Course not found.
      </div>
    );
  }

  const handleToggle = (studentId: string, experimentId: string) => {
    const key = `${studentId}_${experimentId}`;
    const current = statusMap.get(key) || 'pending';
    const next = nextStatus(current);
    const entry: StatusEntry = {
      courseId: course.id,
      studentId,
      experimentId,
      status: next,
      updatedAt: new Date().toISOString(),
    };
    setStatus(entry);
    setStatusMap(prev => {
      const m = new Map(prev);
      m.set(key, next);
      return m;
    });
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const student: Student = {
      id: uuid(),
      name: newStudentName.trim(),
      rollNumber: newStudentRoll.trim() || `S${(course.students.length + 1).toString().padStart(3, '0')}`,
    };
    const updated = { ...course, students: [...course.students, student] };
    updateCourse(updated);
    setCourse(updated);
    setNewStudentName('');
    setNewStudentRoll('');
  };

  const handleAddExperiment = () => {
    if (!newExpTitle.trim()) return;
    const exp: Experiment = {
      id: uuid(),
      shortCode: `EXP ${(course.experiments.length + 1).toString().padStart(2, '0')}`,
      title: newExpTitle.trim(),
      description: newExpDesc.trim() || undefined,
    };
    const updated = { ...course, experiments: [...course.experiments, exp] };
    updateCourse(updated);
    setCourse(updated);
    setNewExpTitle('');
    setNewExpDesc('');
  };

  const handleDeleteCourse = () => {
    if (window.confirm(`Delete "${course.name}"? This cannot be undone.`)) {
      deleteCourse(course.id);
      navigate('/');
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    const updated = { ...course, students: course.students.filter(s => s.id !== studentId) };
    updateCourse(updated);
    setCourse(updated);
  };

  const handleRemoveExperiment = (expId: string) => {
    const updated = { ...course, experiments: course.experiments.filter(e => e.id !== expId) };
    updateCourse(updated);
    setCourse(updated);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowManage(!showManage)} className="p-2 text-muted-foreground hover:text-foreground cell-transition">
              <Settings size={18} />
            </button>
            <button onClick={() => exportPDF(course)} className="p-2 text-muted-foreground hover:text-foreground cell-transition" title="Export PDF">
              <FileDown size={18} />
            </button>
            <button onClick={() => exportExcel(course)} className="p-2 text-muted-foreground hover:text-foreground cell-transition" title="Export Excel">
              <FileSpreadsheet size={18} />
            </button>
          </div>
        </div>
        <div>
          <span className="font-mono-display text-xs font-bold text-primary tracking-tight">{course.code}</span>
          <h1 className="text-foreground font-medium text-lg leading-tight">{course.name}</h1>
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-muted-foreground">{stats.total} total</span>
          <span className="text-status-pending">{stats.pending} pending</span>
          <span className="text-status-completed">{stats.completed} done</span>
          <span className="text-status-submitted">{stats.submitted} submitted</span>
        </div>
      </div>

      {/* Manage Panel */}
      {showManage && (
        <div className="border-b border-border px-4 py-4 bg-card space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="status-label text-muted-foreground flex items-center gap-1.5"><UserPlus size={11} /> Add Student</h3>
              <BulkStudentUpload onStudentsAdded={(newStudents) => {
                const updated = { ...course, students: [...course.students, ...newStudents] };
                updateCourse(updated);
                setCourse(updated);
              }} />
            </div>
            <div className="flex gap-2">
              <input value={newStudentRoll} onChange={e => setNewStudentRoll(e.target.value)} placeholder="Roll#"
                className="w-16 bg-background border border-border rounded px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground font-mono-display tabular focus:outline-none focus:border-primary" />
              <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Name"
                className="flex-1 bg-background border border-border rounded px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                onKeyDown={e => e.key === 'Enter' && handleAddStudent()} />
              <button onClick={handleAddStudent} className="bg-primary text-primary-foreground rounded px-2 py-2"><Plus size={14} /></button>
            </div>
          </div>
          <div>
            <h3 className="status-label text-muted-foreground mb-2 flex items-center gap-1.5"><FlaskConical size={11} /> Add Experiment</h3>
            <div className="flex gap-2">
              <input value={newExpTitle} onChange={e => setNewExpTitle(e.target.value)} placeholder="Title"
                className="flex-1 bg-background border border-border rounded px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                onKeyDown={e => e.key === 'Enter' && handleAddExperiment()} />
              <button onClick={handleAddExperiment} className="bg-primary text-primary-foreground rounded px-2 py-2"><Plus size={14} /></button>
            </div>
            <input value={newExpDesc} onChange={e => setNewExpDesc(e.target.value)} placeholder="Description (optional)"
              className="w-full mt-1.5 bg-background border border-border rounded px-2 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary" />
          </div>
          <button onClick={handleDeleteCourse} className="flex items-center gap-1.5 text-destructive text-xs hover:underline">
            <Trash2 size={12} /> Delete Course
          </button>
        </div>
      )}

      {/* Matrix */}
      {course.students.length === 0 || course.experiments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
          {course.students.length === 0 && course.experiments.length === 0
            ? 'Add students and experiments to get started.'
            : course.students.length === 0
            ? 'Add students to see the matrix.'
            : 'Add experiments to see the matrix.'}
        </div>
      ) : (
        <div className="flex-1 overflow-auto scrollbar-thin">
          <div className="inline-flex min-w-full">
            <div className="sticky left-0 z-10 bg-background border-r border-border">
              <div className="h-12 border-b border-border" />
              {course.students.map(student => (
                <div key={student.id} className="h-16 flex items-center px-3 border-b border-border min-w-[140px] group">
                  <div className="truncate">
                    <div className="font-mono-display text-[10px] text-muted-foreground tabular">{student.rollNumber}</div>
                    <div className="text-sm text-foreground truncate">{student.name}</div>
                  </div>
                  {showManage && (
                    <button onClick={() => handleRemoveStudent(student.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-destructive cell-transition">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex border-b border-border h-12 sticky top-0 z-10 bg-background">
                {course.experiments.map(exp => (
                  <div key={exp.id} className="w-16 flex-shrink-0 flex flex-col items-center justify-center px-1 group relative">
                    <span className="font-mono-display text-[10px] font-bold text-primary">{exp.shortCode}</span>
                    {exp.title && <span className="text-[8px] text-muted-foreground truncate max-w-full">{exp.title}</span>}
                    {showManage && (
                      <button onClick={() => handleRemoveExperiment(exp.id)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 text-destructive bg-background rounded-full p-0.5">
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {course.students.map(student => (
                <div key={student.id} className="flex h-16 border-b border-border">
                  {course.experiments.map(exp => (
                    <div key={exp.id} className="w-16 flex-shrink-0 flex items-center justify-center">
                      <StatusCell
                        status={statusMap.get(`${student.id}_${exp.id}`) || 'pending'}
                        onToggle={() => handleToggle(student.id, exp.id)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border px-4 py-2 flex items-center justify-center gap-6 text-[10px]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-status-pending" /> PENDING</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-completed/20 border-2 border-status-completed" /> DONE</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-submitted/20 border-2 border-status-submitted" /> SUBMITTED</span>
      </div>
    </div>
  );
}
