import React from 'react';
import { STATUS_OPTIONS } from '@utils/constants';
import '@styles/admin/StatusDropdown.css';

export default function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [minW, setMinW] = React.useState(null);        // px của nhãn dài nhất
  const wrapRef = React.useRef(null);
  const btnRef = React.useRef(null);

  const label = STATUS_OPTIONS.find(o => o.value === value)?.label || value;
  const options = React.useMemo(
    () => STATUS_OPTIONS.filter(o => o.value),
    []
  );

  // Đo chiều rộng lớn nhất của text option theo đúng style của nút
  const measure = React.useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const cs = window.getComputedStyle(btn);

    // tạo probe ngoài màn hình để đo text với đúng font
    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'nowrap';
    // áp dụng font từ nút
    probe.style.font = cs.font;
    probe.style.letterSpacing = cs.letterSpacing;
    document.body.appendChild(probe);

    let maxText = 0;
    for (const o of options) {
      probe.textContent = o.label;
      maxText = Math.max(maxText, probe.offsetWidth);
    }
    document.body.removeChild(probe);

    // cộng thêm padding ngang của nút
    const pad =
      parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0');
    const border =
      parseFloat(cs.borderLeftWidth || '0') + parseFloat(cs.borderRightWidth || '0');

    // nếu có icon mũi tên/gap, có thể cộng thêm 18–22px
    const extra = 0; // chỉnh nếu bạn thêm icon
    setMinW(Math.ceil(maxText + pad + border + extra) + 20);
  }, [options]);

  React.useLayoutEffect(() => {
    measure();
    // chờ font load xong để đo chính xác
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    // re-measure khi window resize (tuỳ chọn)
    const onR = () => measure();
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, [measure]);

  React.useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="status-dropdown-dd" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`status-dropdown-dd-btn ${value || ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={minW ? { minWidth: `${minW}px` } : undefined}
      >
        {label || 'Chọn trạng thái'}
      </button>

      {open && (
        <ul className="status-dropdow-dd-menu" role="listbox" style={minW ? { minWidth: `${minW}px` } : undefined}>
          {options.map(o => (
            <li key={o.value}>
              <button
                type="button"
                className="status-dropdown-dd-item"
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
