import React, { useMemo, useState, useCallback } from 'react';
import { DAY_KEYS, LABELS, toMin, toHHMM } from '@utils/constants';
import '@styles/teacher/SlotChipPicker.css';




export default function SlotChipPicker({
  availability,
  slotMinutes = 60,
  bookedKeys = [],
  pickedKeys = [],
  limit = Infinity,             // số slot cần chọn (quota)
  onToggle,                     // (key) => void
}) {
  const [tod, setTod] = useState('all'); // all|morning|afternoon|evening
  const booked = useMemo(() => new Set(bookedKeys || []), [bookedKeys]);
  const picked = useMemo(() => new Set(pickedKeys || []), [pickedKeys]);

  // Chuẩn hóa thành slot
  const slotsByDay = useMemo(() => {
    const out = {}; DAY_KEYS.forEach(d => out[d] = []);
    if (!availability) return out;

    const isAlreadySlots = DAY_KEYS.every(d =>
      (availability?.[d] || []).every(it => toMin(it.end) - toMin(it.start) === slotMinutes)
    );
    if (isAlreadySlots) return availability;

    DAY_KEYS.forEach(d => {
      (availability[d] || []).forEach(({start,end}) => {
        let s = toMin(start), e = toMin(end);
        for (let m = s; m + slotMinutes <= e; m += slotMinutes) {
          out[d].push({ start: toHHMM(m), end: toHHMM(m + slotMinutes) });
        }
      });
    });
    return out;
  }, [availability, slotMinutes]);

  // Lọc theo buổi
  const inTod = useCallback((startMin) => {
    if (tod === 'all') return true;
    if (tod === 'morning')   return startMin >= 5*60  && startMin < 12*60;
    if (tod === 'afternoon') return startMin >= 12*60 && startMin < 18*60;
    if (tod === 'evening')   return startMin >= 18*60 && startMin < 24*60;
    return true;
  }, [tod]);

  const groups = useMemo(() => {
    return DAY_KEYS.map((d, i) => {
      const items = (slotsByDay[d] || [])
        .map(s => ({ ...s, key: `${d} ${s.start}-${s.end}`, startMin: toMin(s.start) }))
        .filter(s => inTod(s.startMin))
        .sort((a, b) => a.startMin - b.startMin);
      return { day: d, label: LABELS[i], items };
    }).filter(g => g.items.length > 0);
  }, [slotsByDay, inTod]);

  const canPickMore = picked.size < limit;

  const handleClick = useCallback((key, disabled) => {
    if (disabled) return;
    onToggle?.(key);
  }, [onToggle]);

  // Gợi ý: chọn các slot sớm nhất còn trống tới khi đủ quota
  const quickPick = () => {
    if (!canPickMore) return;
    const remain = limit - picked.size;
    const candidates = groups.flatMap(g => g.items.map(it => it.key))
      .filter(k => !booked.has(k) && !picked.has(k));
    for (let i = 0; i < Math.min(remain, candidates.length); i++) {
      onToggle?.(candidates[i]);
    }
  };

  return (
    <div className="scp">
      <div className="scp-toolbar">
        <div className="scp-filters">
          {[
            { id:'all', label:'Tất cả' },
            { id:'morning', label:'Sáng' },
            { id:'afternoon', label:'Chiều' },
            { id:'evening', label:'Tối' },
          ].map(f => (
            <button key={f.id}
              className={`scp-filter ${tod===f.id?'active':''}`}
              onClick={() => setTod(f.id)}
            >{f.label}</button>
          ))}
        </div>
        <div className="scp-quota">
          Đã chọn <b>{picked.size}</b>/<b>{limit}</b>
          <button className="scp-suggest" onClick={quickPick} disabled={!canPickMore}>
            Gợi ý
          </button>
        </div>
      </div>

      {groups.map(g => (
        <div className="scp-day" key={g.day}>
          <div className="scp-day-head">{g.label}</div>
          <div className="scp-chip-row">
            {g.items.map(it => {
              const isBooked = booked.has(it.key);
              const isPicked = picked.has(it.key);
              const disabled = isBooked || (!isPicked && !canPickMore);
              const cls = [
                'scp-chip',
                isPicked ? 'picked' : '',
                isBooked ? 'full' : '',
              ].join(' ').trim();
              return (
                <button
                  key={it.key}
                  className={cls}
                  onClick={() => handleClick(it.key, disabled)}
                  disabled={disabled}
                  title={isBooked ? 'Đã có người đăng ký' : (isPicked ? 'Bấm để bỏ chọn' : 'Bấm để chọn')}
                >
                  {it.start}–{it.end}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!groups.length && (
        <div className="scp-empty">Không có khung giờ phù hợp bộ lọc.</div>
      )}
    </div>
  );
}
