import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { Student } from '@/lib/types';

interface BulkStudentUploadProps {
  onStudentsAdded: (students: Student[]) => void;
}

export function BulkStudentUpload({ onStudentsAdded }: BulkStudentUploadProps) {
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const parseStudents = (text: string): Student[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map((line, i) => {
      // Support formats: "roll,name" or "roll\tname" or just "name"
      const sep = line.includes(',') ? ',' : line.includes('\t') ? '\t' : null;
      if (sep) {
        const parts = line.split(sep).map(p => p.trim());
        return {
          id: uuid(),
          rollNumber: parts[0] || `S${(i + 1).toString().padStart(3, '0')}`,
          name: parts.slice(1).join(' ') || parts[0],
        };
      }
      return {
        id: uuid(),
        rollNumber: `S${(i + 1).toString().padStart(3, '0')}`,
        name: line,
      };
    });
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    const students = parseStudents(bulkText);
    if (students.length > 0) {
      onStudentsAdded(students);
      setBulkText('');
      setShowBulk(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setBulkText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!showBulk) {
    return (
      <button
        onClick={() => setShowBulk(true)}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Upload size={12} /> Bulk Upload
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Upload size={12} /> Bulk Add Students
        </span>
        <button onClick={() => setShowBulk(false)} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        One student per line. Format: <span className="font-mono-display">Roll#, Name</span> or just <span className="font-mono-display">Name</span>
      </p>
      <textarea
        value={bulkText}
        onChange={e => setBulkText(e.target.value)}
        placeholder={"101, John Doe\n102, Jane Smith\n103, Alex Kumar"}
        rows={5}
        className="w-full bg-background border border-border rounded px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 font-mono-display focus:outline-none focus:border-primary resize-none"
      />
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1.5"
        >
          <FileText size={12} /> Load CSV/TXT
        </button>
        <button
          onClick={handleBulkAdd}
          disabled={!bulkText.trim()}
          className="flex-1 bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium disabled:opacity-40"
        >
          Add {bulkText.trim() ? parseStudents(bulkText).length : 0} Students
        </button>
      </div>
    </div>
  );
}
