"use client";

import React, { useState, useEffect } from 'react';
import { View } from '../types';
import Nav from '../components/Nav';
import HomeView from '../views/HomeView';
import ProfileView from '../views/ProfileView';
import PreChatView from '../views/PreChatView';
import ChatView from '../views/ChatView';
import ResultsView from '../views/ResultsView';
import MarketView from '../views/MarketView';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://teamfivetactics-vnai2026-1.onrender.com';

export default function SkillCompassApp() {
  const [view, setView] = useState<View>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('demo@gmail.com');
  const [password, setPassword] = useState('abc@123');
  const [username, setUsername] = useState('demo');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const navigate = (v: View) => setView(v);
  const showNav = view !== 'chat';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login' 
      ? { email, password }
      : { email, password, username };

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi trong quá trình xác thực.');
      }

      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        if (data.user) {
          localStorage.setItem('user_info', JSON.stringify(data.user));
        }
        setIsLoggedIn(true);
        setIsAuthOpen(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setIsLoggedIn(false);
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

      {showNav && <Nav onNavigate={navigate} onOpenAuth={() => setIsAuthOpen(true)} isLoggedIn={isLoggedIn} onLogout={handleLogout} />}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontWeight: 500, fontSize: '28px', lineHeight: '32px', color: '#06040E' }}>
                {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </h2>
              <button onClick={() => setIsAuthOpen(false)} style={{
                background: 'transparent', border: 'none', fontSize: '24px', lineHeight: '28px', cursor: 'pointer', color: 'rgba(6,4,14,0.4)'
              }}>×</button>
            </div>

            {authError && (
              <div style={{ background: '#FCE8E6', color: '#D93025', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', marginBottom: '20px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: '15px', color: '#06040E', marginBottom: '6px' }}>Tên người dùng</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="demo" style={{
                      width: '100%', height: '48px', borderRadius: '20px', background: '#F5F5F5',
                      border: '1px solid transparent', padding: '0 16px', fontSize: '15px', color: '#06040E', outline: 'none'
                    }} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: '15px', color: '#06040E', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="demo@gmail.com" style={{
                    width: '100%', height: '48px', borderRadius: '20px', background: '#F5F5F5',
                    border: '1px solid transparent', padding: '0 16px', fontSize: '15px', color: '#06040E', outline: 'none'
                  }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: '15px', color: '#06040E', marginBottom: '6px' }}>Mật khẩu</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{
                    width: '100%', height: '48px', borderRadius: '20px', background: '#F5F5F5',
                    border: '1px solid transparent', padding: '0 16px', fontSize: '15px', color: '#06040E', outline: 'none'
                  }} />
                </div>
              </div>

              <button type="submit" disabled={authLoading} className="gemini-gradient-btn" style={{
                width: '100%', height: '52px', borderRadius: '26px',
                border: 'none', fontWeight: 500, fontSize: '16px', cursor: authLoading ? 'wait' : 'pointer',
                opacity: authLoading ? 0.7 : 1
              }}>
                {authLoading ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng nhập' : 'Đăng ký ngay')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '15px', color: '#5F6368' }}>
              {authMode === 'login' ? (
                <>Chưa có tài khoản? <span onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ color: '#0260FF', fontWeight: 500, cursor: 'pointer' }}>Đăng ký ngay</span></>
              ) : (
                <>Đã có tài khoản? <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: '#0260FF', fontWeight: 500, cursor: 'pointer' }}>Đăng nhập</span></>
              )}
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
