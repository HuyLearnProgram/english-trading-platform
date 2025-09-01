// src/components/order/SlotSection.jsx
import React from 'react';
import SlotChipPicker from '@components/teacher/SlotChipPicker';

export default function SlotSection({
  maxWeek,
  lessonsPerWeek,
  weeklyAvailabilitySlots,
  slotMinutes,
  bookedKeys,
  picked,
  onToggle,
  labelFromKey,
}) {
  return (
    <div className="box">
      <h4>Lịch trống của giáo viên</h4>
      {maxWeek === 0 && <div className="muted">Giáo viên chưa mở lịch.</div>}
      {maxWeek > 0 && (
        <>
          <div className="muted small">Chọn tối đa <strong>{lessonsPerWeek}</strong> khung giờ/tuần.</div>
          <SlotChipPicker
            availability={weeklyAvailabilitySlots}
            slotMinutes={slotMinutes}
            bookedKeys={bookedKeys}
            pickedKeys={picked}
            limit={lessonsPerWeek}
            onToggle={onToggle}
          />
          <div className="muted small" style={{marginTop:8}}>
            {picked.length
              ? <>Bạn đã chọn: <strong>{picked.map(labelFromKey).join(' ; ')}</strong></>
              : 'Chưa chọn khung giờ nào.'}
          </div>
        </>
      )}
    </div>
  );
}
