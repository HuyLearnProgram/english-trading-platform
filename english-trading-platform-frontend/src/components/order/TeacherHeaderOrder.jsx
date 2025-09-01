import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherHeaderOrder({ teacher }) {
  return (
    <div className="teacher-card">
      <img src={teacher.avatarUrl || `https://i.pravatar.cc/200?u=${teacher.id}`} alt={teacher.fullName}/>
      <div className="t-info">
        <div className="t-name">{teacher.fullName}</div>
        <div className="t-meta">
          {teacher.country || '—'} · {teacher.lessonLengthMinutes} phút/buổi
        </div>
        <Link className="view-link" to={`/teacher/${teacher.id}`} target="_blank" rel="noreferrer">Xem hồ sơ</Link>
      </div>
    </div>
  );
}
