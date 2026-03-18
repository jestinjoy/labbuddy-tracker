import { Course, StatusEntry } from './types';

const COURSES_KEY = 'catalyst_courses';
const STATUSES_KEY = 'catalyst_statuses';

export function getCourses(): Course[] {
  const raw = localStorage.getItem(COURSES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCourses(courses: Course[]) {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function getCourse(id: string): Course | undefined {
  return getCourses().find(c => c.id === id);
}

export function addCourse(course: Course) {
  const courses = getCourses();
  courses.push(course);
  saveCourses(courses);
}

export function updateCourse(course: Course) {
  const courses = getCourses().map(c => c.id === course.id ? course : c);
  saveCourses(courses);
}

export function deleteCourse(id: string) {
  saveCourses(getCourses().filter(c => c.id !== id));
  // Also clean up statuses
  const statuses = getStatuses().filter(s => s.courseId !== id);
  saveStatuses(statuses);
}

export function getStatuses(): StatusEntry[] {
  const raw = localStorage.getItem(STATUSES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveStatuses(statuses: StatusEntry[]) {
  localStorage.setItem(STATUSES_KEY, JSON.stringify(statuses));
}

export function getStatus(courseId: string, studentId: string, experimentId: string): StatusEntry | undefined {
  return getStatuses().find(s => s.courseId === courseId && s.studentId === studentId && s.experimentId === experimentId);
}

export function setStatus(entry: StatusEntry) {
  const statuses = getStatuses().filter(
    s => !(s.courseId === entry.courseId && s.studentId === entry.studentId && s.experimentId === entry.experimentId)
  );
  statuses.push(entry);
  saveStatuses(statuses);
}
