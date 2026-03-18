import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Course, Student, Experiment } from '@/lib/types';
import { addCourse } from '@/lib/store';
import { ArrowLeft, Plus, Trash2, UserPlus, FlaskConical } from 'lucide-react';
import { BulkStudentUpload } from '@/components/BulkStudentUpload';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const addStudent = () => {
    if (!studentName.trim()) return;
    setStudents(prev => [...prev, {
      id: uuid(),
      name: studentName.trim(),
      rollNumber: studentRoll.trim() || `S${(prev.length + 1).toString().padStart(3, '0')}`
    }]);
    setStudentName('');
    setStudentRoll('');
  };

  const addExperiment = () => {
    if (!expTitle.trim()) return;
    const num = experiments.length + 1;
    setExperiments(prev => [...prev, {
      id: uuid(),
      shortCode: `EXP ${num.toString().padStart(2, '0')}`,
      title: expTitle.trim(),
      description: expDesc.trim() || undefined
    }]);
    setExpTitle('');
    setExpDesc('');
  };

  const handleSave = () => {
    if (!code.trim() || !name.trim()) return;
    const course: Course = {
      id: uuid(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      students,
      experiments,
    };
    addCourse(course);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="font-mono-display text-xl font-bold tracking-tight text-foreground mb-6">
        NEW COURSE
      </h1>

      {/* Course Info */}
      <div className="space-y-3 mb-8">
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Course Code (e.g. BIO101)"
          className="w-full bg-card border border-border rounded px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground font-mono-display tracking-tight focus:outline-none focus:border-primary"
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Course Name"
          className="w-full bg-card border border-border rounded px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Students */}
      <div className="mb-8">
        <h2 className="status-label text-muted-foreground mb-3 flex items-center gap-2">
          <UserPlus size={12} /> Students ({students.length})
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            value={studentRoll}
            onChange={e => setStudentRoll(e.target.value)}
            placeholder="Roll #"
            className="w-20 bg-card border border-border rounded px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground font-mono-display tabular focus:outline-none focus:border-primary"
          />
          <input
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="Student Name"
            className="flex-1 bg-card border border-border rounded px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && addStudent()}
          />
          <button onClick={addStudent} className="bg-primary text-primary-foreground rounded px-3 py-2.5">
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          {students.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-card border border-border rounded px-3 py-2 text-sm">
              <span>
                <span className="font-mono-display text-muted-foreground text-xs mr-2 tabular">{s.rollNumber}</span>
                <span className="text-foreground">{s.name}</span>
              </span>
              <button onClick={() => setStudents(prev => prev.filter(x => x.id !== s.id))} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Experiments */}
      <div className="mb-8">
        <h2 className="status-label text-muted-foreground mb-3 flex items-center gap-2">
          <FlaskConical size={12} /> Experiments ({experiments.length})
        </h2>
        <div className="space-y-2 mb-3">
          <input
            value={expTitle}
            onChange={e => setExpTitle(e.target.value)}
            placeholder="Experiment Title"
            className="w-full bg-card border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            onKeyDown={e => e.key === 'Enter' && addExperiment()}
          />
          <input
            value={expDesc}
            onChange={e => setExpDesc(e.target.value)}
            placeholder="Brief description (optional)"
            className="w-full bg-card border border-border rounded px-3 py-2.5 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
          />
          <button onClick={addExperiment} className="bg-primary text-primary-foreground rounded px-4 py-2.5 text-sm font-medium w-full">
            Add Experiment
          </button>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          {experiments.map(e => (
            <div key={e.id} className="flex items-center justify-between bg-card border border-border rounded px-3 py-2 text-sm">
              <span>
                <span className="font-mono-display text-primary text-xs mr-2">{e.shortCode}</span>
                <span className="text-foreground">{e.title}</span>
              </span>
              <button onClick={() => setExperiments(prev => prev.filter(x => x.id !== e.id))} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!code.trim() || !name.trim()}
        className="w-full bg-primary text-primary-foreground rounded py-3.5 font-medium text-sm disabled:opacity-40 cell-transition"
      >
        Create Course
      </button>
    </div>
  );
}
