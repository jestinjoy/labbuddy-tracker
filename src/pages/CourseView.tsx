import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, updateCourse, getStatuses, setStatus, deleteCourse } from '@/lib/store';
import { ExperimentStatus, nextStatus, StatusEntry, Student, Experiment } from '@/lib/types';
import { StatusCell } from '@/components/StatusCell';
import { DetailDialog } from '@/components/DetailDialog';
import { exportPDF, exportExcel } from '@/lib/export';
import { ArrowLeft, FileDown, FileSpreadsheet, Trash2, Plus, UserPlus, FlaskConical, Settings, Lock, LockOpen, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { BulkStudentUpload } from '@/components/BulkStudentUpload';
import { v4 as uuid } from 'uuid';

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState(() => getCourse(id!));
  const [statusMap, setStatusMap] = useState<Map<string, { status: ExperimentStatus; updatedAt?: string; completedAt?: string }>>(() => {
    const map = new Map<string, { status: ExperimentStatus; updatedAt?: string; completedAt?: string }>();
    getStatuses().filter(s => s.courseId === id).forEach(s => {
      map.set(`${s.studentId}_${s.experimentId}`, { status: s.status, updatedAt: s.updatedAt, completedAt: s.completedAt });
    });
    return map;
  });

  const [showManage, setShowManage] = useState(false);
  const [locked, setLocked] = useState(true);

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [dragExpId, setDragExpId] = useState<string | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [detailExperiment, setDetailExperiment] = useState<Experiment | null>(null);

  type SortKey = 'name' | 'roll' | 'progress';
  type SortDir = 'asc' | 'desc';
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });

  const stats = useMemo(() => {
    if (!course) return { total: 0, pending: 0, completed: 0, submitted: 0 };
    const total = course.students.length * course.experiments.length;
    let completed = 0, submitted = 0;
    statusMap.forEach(v => {
      if (v.status === 'completed') completed++;
      if (v.status === 'submitted') submitted++;
    });
    return { total, pending: total - completed - submitted, completed, submitted };
  }, [statusMap, course]);

  const studentProgress = useMemo(() => {
    if (!course) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const student of course.students) {
      let done = 0;
      for (const exp of course.experiments) {
        const s = statusMap.get(`${student.id}_${exp.id}`)?.status;
        if (s === 'completed' || s === 'submitted') done++;
      }
      map.set(student.id, course.experiments.length ? done / course.experiments.length : 0);
    }
    return map;
  }, [statusMap, course]);

  const sortedStudents = useMemo(() => {
    if (!course) return [];
    const list = [...course.students];
    list.sort((a, b) => {
      let cmp = 0;
      if (sort.key === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      } else if (sort.key === 'roll') {
        cmp = a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
      } else if (sort.key === 'progress') {
        cmp = (studentProgress.get(a.id) || 0) - (studentProgress.get(b.id) || 0);
      }
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [course, sort, studentProgress]);

  const toggleSort = (key: SortKey) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort.key !== k) return <ArrowUpDown size={10} className="text-muted-foreground/40" />;
    return sort.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />;
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Course not found.
      </div>
    );
  }

  const handleToggle = (studentId: string, experimentId: string) => {
    const key = `${studentId}_${experimentId}`;
    const currentEntry = statusMap.get(key);
    const current = currentEntry?.status || 'pending';
    const next = nextStatus(current);
    const now = new Date().toISOString();
    const completedAt = next === 'completed' ? now : next === 'submitted' ? currentEntry?.completedAt : undefined;
    const entry: StatusEntry = {
      courseId: course.id,
      studentId,
      experimentId,
      status: next,
      updatedAt: now,
      completedAt,
    };
    setStatus(entry);
    setStatusMap(prev => {
      const m = new Map(prev);
      m.set(key, { status: next, updatedAt: now, completedAt });
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

  const handleExpDrop = (targetExpId: string) => {
    if (!dragExpId || dragExpId === targetExpId) return;
    const exps = [...course.experiments];
    const fromIdx = exps.findIndex(e => e.id === dragExpId);
    const toIdx = exps.findIndex(e => e.id === targetExpId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = exps.splice(fromIdx, 1);
    exps.splice(toIdx, 0, moved);
    const updated = { ...course, experiments: exps };
    updateCourse(updated);
    setCourse(updated);
    setDragExpId(null);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocked(l => !l)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-[10px] uppercase tracking-widest cell-transition ${locked ? 'border-border text-muted-foreground' : 'border-status-completed text-status-completed bg-status-completed/10'}`}
              title={locked ? 'Editing locked — tap to unlock status changes' : 'Editing unlocked — tap to lock'}
            >
              {locked ? <Lock size={13} /> : <LockOpen size={13} />}
              {locked ? 'Locked' : 'Editing'}
            </button>
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
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-background border-b border-r border-border h-12 min-w-[140px] p-0">
                  <div className="flex items-center justify-between h-full px-3">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground cell-transition"
                    >
                      Name <SortIcon k="name" />
                    </button>
                    <button
                      onClick={() => toggleSort('roll')}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground cell-transition"
                    >
                      Roll <SortIcon k="roll" />
                    </button>
                    <button
                      onClick={() => toggleSort('progress')}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground cell-transition"
                      title="Sort by completion progress"
                    >
                      % <SortIcon k="progress" />
                    </button>
                  </div>
                </th>
                {course.experiments.map(exp => (
                  <th key={exp.id}
                    className={`sticky top-0 z-20 bg-background border-b border-border h-12 w-16 p-0 ${showManage ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${dragExpId === exp.id ? 'opacity-40' : ''}`}
                    draggable={showManage}
                    onDragStart={() => showManage && setDragExpId(exp.id)}
                    onDragOver={e => { if (showManage) e.preventDefault(); }}
                    onDrop={() => showManage && handleExpDrop(exp.id)}
                    onDragEnd={() => setDragExpId(null)}
                    onClick={() => !showManage && setDetailExperiment(exp)}
                  >
                    <div className="flex flex-col items-center justify-center px-1 group relative h-full">
                      <span className="font-mono-display text-[10px] font-bold text-primary">{exp.shortCode}</span>
                      {exp.title && <span className="text-[8px] text-muted-foreground truncate max-w-[60px]">{exp.title}</span>}
                      {showManage && (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveExperiment(exp.id); }}
                          className="absolute -top-1 -right-1 text-destructive bg-background rounded-full p-0.5">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map(student => (
                <tr key={student.id}>
                  <th className="sticky left-0 z-10 bg-background border-b border-r border-border h-16 min-w-[140px] p-0 text-left font-normal">
                    <div
                      className="flex items-center px-3 h-full group cursor-pointer hover:bg-accent/30 cell-transition"
                      onClick={() => !showManage && setDetailStudent(student)}
                    >
                      <div className="truncate flex-1">
                        <div className="font-mono-display text-[10px] text-muted-foreground tabular">{student.rollNumber}</div>
                        <div className="text-sm text-foreground truncate">{student.name}</div>
                      </div>
                      {showManage ? (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id); }}
                          className="ml-2 text-destructive">
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <div className="ml-2 text-[9px] text-muted-foreground tabular">
                          {Math.round((studentProgress.get(student.id) || 0) * 100)}%
                        </div>
                      )}
                    </div>
                  </th>
                  {course.experiments.map(exp => {
                    const entry = statusMap.get(`${student.id}_${exp.id}`);
                    return (
                      <td key={exp.id} className="border-b border-border w-16 h-16 p-0">
                        <div className="flex items-center justify-center h-full">
                          <StatusCell
                            status={entry?.status || 'pending'}
                            locked={locked}

                            updatedAt={entry?.updatedAt}
                            completedAt={entry?.completedAt}
                            onToggle={() => handleToggle(student.id, exp.id)}
                            onManualEdit={(data) => {
                              const now = new Date().toISOString();
                              const statusEntry: StatusEntry = {
                                courseId: course.id,
                                studentId: student.id,
                                experimentId: exp.id,
                                status: data.status,
                                updatedAt: data.status === 'submitted' ? (data.submittedAt || now) : (data.completedAt || now),
                                completedAt: data.completedAt,
                              };
                              setStatus(statusEntry);
                              const key = `${student.id}_${exp.id}`;
                              setStatusMap(prev => {
                                const m = new Map(prev);
                                m.set(key, { status: data.status, updatedAt: statusEntry.updatedAt, completedAt: data.completedAt });
                                return m;
                              });
                            }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DetailDialog
        open={!!detailStudent}
        onOpenChange={(o) => !o && setDetailStudent(null)}
        title={detailStudent?.name || ''}
        subtitle={detailStudent ? `Roll ${detailStudent.rollNumber}` : ''}
      />
      <DetailDialog
        open={!!detailExperiment}
        onOpenChange={(o) => !o && setDetailExperiment(null)}
        title={detailExperiment?.title || ''}
        subtitle={detailExperiment?.shortCode}
        description={detailExperiment?.description}
      />

      <div className="border-t border-border px-4 py-2 flex items-center justify-center gap-6 text-[10px]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-status-pending" /> PENDING</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-completed/20 border-2 border-status-completed" /> DONE</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-status-submitted/20 border-2 border-status-submitted" /> SUBMITTED</span>
      </div>
    </div>
  );
}
