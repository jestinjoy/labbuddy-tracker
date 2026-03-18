import { Course } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { Users, FlaskConical, ChevronRight } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  const pending = course.experiments.length * course.students.length;

  return (
    <button
      onClick={() => navigate(`/course/${course.id}`)}
      className="w-full text-left bg-card border border-border rounded p-4 cell-transition hover:border-primary/50 active:bg-accent"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-display text-sm font-bold tracking-tight text-primary">
          {course.code}
        </span>
        <ChevronRight size={16} className="text-muted-foreground" />
      </div>
      <h3 className="text-foreground font-medium text-base mb-3 leading-tight">
        {course.name}
      </h3>
      <div className="flex items-center gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <Users size={13} />
          {course.students.length}
        </span>
        <span className="flex items-center gap-1.5">
          <FlaskConical size={13} />
          {course.experiments.length}
        </span>
      </div>
    </button>
  );
}
