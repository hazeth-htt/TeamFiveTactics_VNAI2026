import React, { useState, useEffect } from 'react';
import { View } from '../types';

function Nav({ onNavigate, onOpenAuth, isLoggedIn, onLogout }: { onNavigate: (v: View) => void, onOpenAuth: () => void, isLoggedIn: boolean, onLogout: () => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header style={{ padding: '24px 48px 0', background: '#FAFAFA', position: 'sticky', top: 0, zIndex: 100 }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          padding: '0 24px',
          borderRadius: '20px',
          background: '#FFFFFF',
          border: '1px solid rgba(6,4,14,0.06)',
          boxShadow: '0 4px 24px rgba(6,4,14,0.02)',
        }}
      >
        <button
          onClick={() => onNavigate('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 500, fontSize: '24px', lineHeight: '28px', color: '#06040E', letterSpacing: '-0.3px' }}>
            Career Pilot
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {[{ name: 'Trang chủ', id: 'home' }, { name: 'Xu hướng', id: 'market' }, { name: 'Hồ sơ cá nhân', id: 'profile' }].map(l => (
            <button key={l.name} className="nav-link" onClick={() => onNavigate(l.id as View)}>
              {l.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px 8px 12px', borderRadius: '22px', border: '1px solid rgba(0,0,0,0.06)',
                  background: '#FFFFFF', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  fontFamily: '"Google Sans Flex", sans-serif'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06040E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span style={{ fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>Hồ sơ</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06040E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 10px rgba(0,0,0,.05)', padding: '8px', minWidth: '200px',
                  display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 200
                }}>
                  <button onClick={() => { setProfileOpen(false); onNavigate('profile'); }} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderRadius: '12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: 400, fontSize: '16px', color: '#06040E', transition: 'background 0.2s', textAlign: 'left'
                  }} onMouseOver={e => e.currentTarget.style.background = '#F5F5F5'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06040E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Hồ sơ của tôi
                  </button>
                  <button onClick={() => { setProfileOpen(false); onLogout(); }} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderRadius: '12px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: 400, fontSize: '16px', color: '#D93025', transition: 'background 0.2s', textAlign: 'left'
                  }} onMouseOver={e => e.currentTarget.style.background = '#FEE8E7'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D93025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="gemini-gradient-btn"
              onClick={onOpenAuth}
              style={{
                padding: '14px 28px', borderRadius: '28px',
                fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '20px',
                cursor: 'pointer',
              }}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Nav;
