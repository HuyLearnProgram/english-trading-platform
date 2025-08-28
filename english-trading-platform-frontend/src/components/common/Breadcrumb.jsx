import React from 'react';
import { Link } from 'react-router-dom';
import '@styles/common/Breadcrumb.css'; // Ensure you have the appropriate styles

const Breadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className={isLast ? 'is-active' : ''}>
              {isLast || !it.to ? (
                <span>{it.label}</span>
              ) : (
                <Link to={it.to}>{it.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
