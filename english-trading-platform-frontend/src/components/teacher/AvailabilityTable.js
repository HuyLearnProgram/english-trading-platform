import React from 'react';
import '@styles/teacher/AvailabilityTable.css';

export default function AvailabilityTable({ weeklyAvailability }) {
  const days = ['mon','tue','wed','thu','fri','sat','sun'];
  const labels = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];

  return (
    <table className="avail">
      <thead><tr>{labels.map((l,i)=><th key={i}>{l}</th>)}</tr></thead>
      <tbody>
        <tr>
          {days.map((d,i)=>(
            <td key={i}>
              {(weeklyAvailability?.[d] ?? []).length
                ? weeklyAvailability[d].map((itv,idx)=>(<div key={idx} className="slot">{itv.start} – {itv.end}</div>))
                : <span className="muted">—</span>}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
