// src/components/teacher/AvailabilityTable.jsx
import React, { useMemo } from 'react';
import { DAY_KEYS, LABELS, toMin, toHHMM } from '@utils/constants';
import '@styles/teacher/AvailabilityTable.css';


/**
 * Props:
 *  - availability: { mon:[{start,end}], ... } (ưu tiên weeklyAvailabilitySlots từ BE)
 *  - slotMinutes: 60 | 90 | 120 (nếu BE không đưa slots mà đưa khoảng, component sẽ tự tách theo slot)
 */
export default function AvailabilityTable({ weeklyAvailability: availability, slotMinutes = 60 }) {
  // nếu BE trả sẵn slot (mỗi item đúng slotMinutes) -> dùng luôn
  const isAlreadySlots = useMemo(() => {
    return DAY_KEYS.every(d =>
      (availability?.[d] || []).every(it => toMin(it.end) - toMin(it.start) === slotMinutes)
    );
  }, [availability, slotMinutes]);

  const slots = useMemo(() => {
    if (!availability) return {};
    if (isAlreadySlots) return availability;

    // tự tách nếu nhận "khoảng"
    const out = {};
    DAY_KEYS.forEach(d => out[d] = []);
    DAY_KEYS.forEach(d => {
      (availability[d] || []).forEach(({start,end}) => {
        let s = toMin(start), e = toMin(end);
        for (let m = s; m + slotMinutes <= e; m += slotMinutes) {
          out[d].push({ start: toHHMM(m), end: toHHMM(m + slotMinutes) });
        }
      });
    });
    return out;
  }, [availability, isAlreadySlots, slotMinutes]);

  // tìm dải hiển thị
  const [minM, maxM] = useMemo(() => {
    let mn = Infinity, mx = -Infinity;
    DAY_KEYS.forEach(d => (slots[d] || []).forEach(s => {
      mn = Math.min(mn, toMin(s.start));
      mx = Math.max(mx, toMin(s.end));
    }));
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) { mn = 7*60; mx = 22*60; }
    return [mn, mx];
  }, [slots]);

  const rows = useMemo(() => {
    const arr = [];
    for (let m = minM; m < maxM; m += slotMinutes) {
      arr.push({ m, label: `${toHHMM(m)} - ${toHHMM(m + slotMinutes)}` });
    }
    return arr;
  }, [minM, maxM, slotMinutes]);

  const has = useMemo(() => {
    const set = new Set();
    DAY_KEYS.forEach((d,di) =>
      (slots[d] || []).forEach(s => set.add(`${di}:${toMin(s.start)}`))
    );
    return set;
  }, [slots]);

  return (
    <table className="avail-grid">
      <thead>
        <tr>
          {LABELS.map((l,i)=><th key={i}>{l}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.m}>
            {DAY_KEYS.map((d,di) => {
              const on = has.has(`${di}:${r.m}`);
              return <td key={d} className={on ? 'on' : ''}>{on ? <div className="slot">{r.label}</div> : null}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
