export type CalendarEntry = {
  enrollmentId: number;
  teacherId: number;
  teacherAvatarUrl?: string | null;
  teacherName?: string | null;
  timezone: string;                // vd: 'Asia/Ho_Chi_Minh'
  startDate: string;               // YYYY-MM-DD (local theo timezone)
  endDate: string;                 // YYYY-MM-DD (local theo timezone)
  lessons: number;                 // tổng số buổi
  lessonLength: number;            // phút/buổi
  lessonsPerWeek: number;          // buổi/tuần
  slots: string[];                 // ví dụ: ['mon 20:00-21:00','fri 09:00-10:00']
  events: Array<{
    lessonNo: number;              // buổi số mấy (1..N)
    date: string;                  // YYYY-MM-DD (local theo timezone)
    start: string;                 // HH:mm (local)
    end: string;                   // HH:mm (local)
    weekday: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
  }>;
  createdAt: string;               // ISO
};