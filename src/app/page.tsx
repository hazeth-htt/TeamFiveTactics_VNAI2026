"use client";

import React, { useState } from 'react';
import { View } from '../types';
import Nav from '../components/Nav';
import HomeView from '../views/HomeView';
import ProfileView from '../views/ProfileView';
import PreChatView from '../views/PreChatView';
import ChatView from '../views/ChatView';
import ResultsView from '../views/ResultsView';
import MarketView from '../views/MarketView';

export default function SkillCompassApp() {
  const [view, setView] = useState<View>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const navigate = (v: View) => setView(v);
  const showNav = view !== 'chat';

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsAuthOpen(false);
    setView('home');
  };

  return (
    <div style={{ fontFamily: '"Google Sans Flex", sans-serif', background: '#FAFAFA', minHeight: '100vh' }}>
      <style>{`
        .nav-link {
          position: relative;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          font-family: "Google Sans Flex", sans-serif;
          font-weight: 500;
          font-size: 16px;
          line-height: 20px;
          color: #06040E;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 4px;
          left: 50%;
          background: linear-gradient(53deg, #0260FF 9.29%, #40A2FF 48.23%, #A8BEFF 82.56%);
          transition: all 0.2s ease-in-out;
          transform: translateX(-50%);
          border-radius: 2px;
        }
        .nav-link:hover::after {
          width: calc(100% - 32px);
        }

        .gemini-gradient-text {
          color: #0260FF;
          display: inline-block;
        }
        .gemini-gradient-btn {
          background: linear-gradient(53deg, #0260FF 9.29%, #40A2FF 48.23%, #A8BEFF 82.56%);
          color: #FFFFFF !important;
          border: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        .gemini-gradient-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .gemini-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          margin-bottom: 24px;
          cursor: pointer;
          transition: box-shadow 0.2s;
          text-decoration: none;
        }
        .gemini-pill:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .gemini-card {
          background: #FFFFFF !important;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 2px 10px rgba(0,0,0,.05);
          color: #06040E !important;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        .btn-primary { transition: background 0.2s ease; }
        .btn-primary:hover { background: #234B5E !important; }
        .btn-secondary { transition: background 0.2s ease; }
        .btn-secondary:hover { background: #F5F5F5 !important; border-color: rgba(6,4,14,0.2) !important; }
      `}</style>

      {showNav && <Nav onNavigate={navigate} onOpenAuth={() => setIsAuthOpen(true)} isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />}

      {isAuthOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6,4,14,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '24px'
        }}>
          <div className="gemini-card" style={{
            borderRadius: '20px', width: '100%', maxWidth: '440px',
            padding: '40px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E' }}>Đăng nhập</h2>
              <button onClick={() => setIsAuthOpen(false)} style={{
                background: 'transparent', border: 'none', fontSize: '24px', lineHeight: '28px', cursor: 'pointer', color: 'rgba(6,4,14,0.4)'
              }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Email</label>
                <input type="email" placeholder="name@company.com" style={{
                  width: '100%', height: '48px', borderRadius: '20px', background: '#F5F5F5',
                  border: '1px solid transparent', padding: '0 16px', fontSize: '16px', lineHeight: '20px', color: '#06040E', outline: 'none'
                }} onFocus={e => e.target.style.border = '1px solid rgba(16,36,47,0.3)'} onBlur={e => e.target.style.border = '1px solid transparent'} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Mật khẩu</label>
                <input type="password" placeholder="••••••••" style={{
                  width: '100%', height: '48px', borderRadius: '20px', background: '#F5F5F5',
                  border: '1px solid transparent', padding: '0 16px', fontSize: '16px', lineHeight: '20px', color: '#06040E', outline: 'none'
                }} onFocus={e => e.target.style.border = '1px solid rgba(16,36,47,0.3)'} onBlur={e => e.target.style.border = '1px solid transparent'} />
              </div>
            </div>
            <button className="gemini-gradient-btn" onClick={handleLogin} style={{
              width: '100%', height: '56px', borderRadius: '28px',
              border: 'none', fontWeight: 500, fontSize: '16px', lineHeight: '20px', cursor: 'pointer'
            }}>Đăng nhập</button>
            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '16px', lineHeight: '20px', color: '#5F6368' }}>
              Chưa có tài khoản? <span style={{ color: '#10242F', fontWeight: 500, cursor: 'pointer' }}>Đăng ký ngay</span>
            </p>
          </div>
        </div>
      )}

      {view === 'home' && <HomeView onNavigate={navigate} isLoggedIn={isLoggedIn} onOpenAuth={() => setIsAuthOpen(true)} />}
      {view === 'profile' && <ProfileView onNavigate={navigate} />}
      {view === 'prechat' && <PreChatView onNavigate={navigate} />}
      {view === 'chat' && <ChatView onNavigate={navigate} />}
      {view === 'results' && <ResultsView onNavigate={navigate} />}
      {view === 'market' && <MarketView onNavigate={navigate} />}
    </div>
  );
}
