import React from 'react';
import { STATUS_OPTIONS } from '../../utils/constants';
import '../../styles/StatusDropdown.css';

export default function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const label = STATUS_OPTIONS.find(o => o.value === value)?.label || value;

  React.useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="status-dd" ref={ref}>
      <button
        type="button"
        className={`status-dd-btn ${value}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <ul className="status-dd-menu" role="listbox">
          {STATUS_OPTIONS.filter(o => o.value).map(o => (
            <li key={o.value}>
              <button
                type="button"
                className="status-dd-item"
                onClick={() => { onChange?.(o.value); setOpen(false); }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
