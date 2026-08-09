'use client';

import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import type { Assignment } from '@/lib/types';
import Link from 'next/link';

// Preset colors for assignment cards based on course
const COURSE_COLORS = [
  '#e91e63', // pink
  '#f44336', // red
  '#ff9800', // orange
  '#4caf50', // green
  '#2196f3', // blue
  '#9c27b0', // purple
  '#00bcd4', // cyan
];

const getCourseColor = (courseId: string) => {
  if (!courseId) return COURSE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
};

interface AssignmentCalendarProps {
  assignments: Assignment[];
  role: 'admin' | 'teacher' | 'student';
}

export default function AssignmentCalendar({ assignments, role }: AssignmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  // Get assignments for the selected date
  const selectedDateAssignments = assignments.filter(a => {
    if (!a.dueDate) return false;
    return isSameDay(parseISO(a.dueDate), selectedDate);
  });

  const renderHeader = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={18} style={{ color: 'var(--color-primary)' }} />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} className="btn btn-ghost btn-icon btn-sm" style={{ border: '1px solid var(--color-border)' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="btn btn-ghost btn-icon btn-sm" style={{ border: '1px solid var(--color-border)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-muted)', paddingBottom: '0.5rem' }}>
          {format(addDays(startDate, i), 'EEEEE')}
        </div>
      );
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Check if day has assignments
        const hasAssignments = assignments.some(a => a.dueDate && isSameDay(parseISO(a.dueDate), cloneDay));
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '40px',
              cursor: 'pointer',
              border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: !isCurrentMonth ? 'var(--color-text-muted)' : isSelected ? 'var(--color-primary)' : 'var(--color-text)',
              fontWeight: isSelected ? 700 : 500,
              background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
              transition: 'all 0.2s ease'
            }}
            className={isCurrentMonth && !isSelected ? 'hover-bg-surface-2' : ''}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>{formattedDate}</span>
            {hasAssignments && (
              <span style={{
                position: 'absolute',
                bottom: '4px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--color-danger)',
              }} />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.25rem' }}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', flexGrow: 1 }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--color-text)', fontWeight: 700 }}>
            {format(selectedDate, 'd')}
          </span>
          <span style={{ textTransform: 'uppercase' }}>
            {format(selectedDate, 'EEE')}
          </span>
        </h3>

        {selectedDateAssignments.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No tasks for this day.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {selectedDateAssignments.map(a => {
              const color = getCourseColor(a.courseId);
              
              const CardContent = (
                <div style={{ 
                  background: color,
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  cursor: role !== 'admin' ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease'
                }} className={role !== 'admin' ? 'hover-scale-sm' : ''}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{a.title}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{a.courseName}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {format(parseISO(a.dueDate), 'hh:mm a')}
                    </span>
                  </p>
                </div>
              );

              if (role === 'admin') {
                return <div key={a.id}>{CardContent}</div>;
              }

              return (
                <Link key={a.id} href={`/${role}/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                  {CardContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .hover-bg-surface-2:hover { background: var(--color-surface-2) !important; }
        .hover-scale-sm:hover { transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
