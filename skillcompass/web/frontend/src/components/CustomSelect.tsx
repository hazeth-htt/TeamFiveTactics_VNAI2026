import React, { useState } from 'react';

function CustomSelect({ value, onChange, options, disabled, style }: { value: string, onChange: (v: string) => void, options: string[], disabled?: boolean, style?: React.CSSProperties }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%', background: '#FFFFFF', borderRadius: '14px', padding: '14px 16px',
          border: '1px solid #E5E7EB', outline: 'none', fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E',
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...style
        }}
      >
        <span>{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06040E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 10px rgba(0,0,0,.05)', padding: '8px',
            display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 200,
            maxHeight: '240px', overflowY: 'auto'
          }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} style={{
                display: 'flex', alignItems: 'center', padding: '12px 16px',
                borderRadius: '12px', border: 'none', background: value === opt ? '#F5F5F5' : 'transparent', cursor: 'pointer',
                fontWeight: 400, fontSize: '16px', color: '#06040E', transition: 'background 0.2s', textAlign: 'left'
              }} onMouseOver={e => e.currentTarget.style.background = '#F5F5F5'} onMouseOut={e => {
                if (value !== opt) e.currentTarget.style.background = 'transparent';
              }}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CustomSelect;
