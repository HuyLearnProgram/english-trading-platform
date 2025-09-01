// src/components/order/PackageGrid.jsx
import React from 'react';

export default function PackageGrid({ packages, selectedHours, onSelect, submitting, maxDiscountPct }) {
  return (
    <div className="plan-list">
      {packages.map((p) => {
        const pct = Math.round((p.discountPct || 0) * 100);
        const isBest = p.discountPct === maxDiscountPct && pct > 0;
        return (
          <button
            key={p.hours}
            className={`plan-item pb-20 ${selectedHours === p.hours ? 'active' : ''}`}
            onClick={() => onSelect(p.hours)}
            disabled={submitting}
          >
            <div className="p-title-row">
              <div className="p-title">{p.hours} giờ</div>
              {isBest && <span className="best-tag">Best deal</span>}
            </div>
            <div className="p-sub">≈ {p.lessons} buổi</div>
            {pct > 0 && (
              <span className={`badge-off ${isBest ? 'best' : ''}`}>{pct}% OFF</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
