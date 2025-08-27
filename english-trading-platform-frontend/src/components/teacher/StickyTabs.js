import React, { forwardRef } from 'react';
import '@styles/teacher/StickyTabs.css';

const StickyTabs = forwardRef(function StickyTabs({ top = 0, active, tabs = [], onTabClick }, ref) {
  return (
    <div className="tp-nav" ref={ref} style={{ top }}>
      <div className="tp-nav-inner">
        <ul>
          {tabs.map((t) => (
            <li
              key={t.id}
              className={active === t.id ? 'active' : ''}
              onClick={() => onTabClick?.(t.id)}
            >
              {t.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

export default StickyTabs;
