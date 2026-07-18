import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { Send, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://teamfivetactics-vnai2026-1.onrender.com';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getSessionId = () => {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000';
  let sid = sessionStorage.getItem('skillcompass_session_id');
  const isValidUuid = sid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sid);
  if (!isValidUuid) {
    sid = generateUUID();
    sessionStorage.setItem('skillcompass_session_id', sid!);
  }
  return sid!;
};

function ChatView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [msgs, setMsgs] = useState<Array<{ role: 'ai' | 'user'; text: string; isFinal?: boolean }>>([
    { role: 'ai', text: 'Xin chào! Hãy kể cho tôi nghe về những công việc hoặc sở thích khiến bạn say mê đến quên cả thời gian nhé.', isFinal: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Ensure session ID is initialized
    getSessionId();
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const next = [...msgs, { role: 'user' as const, text: userMsg, isFinal: false }];
    setMsgs(next);
    setInput('');
    setIsLoading(true);

    try {
      const sessionId = getSessionId();
      const res = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userMsg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgs(p => [
          ...p,
          {
            role: 'ai',
            text: (data && data.message) ? (typeof data.message === 'string' ? data.message : JSON.stringify(data.message)) : 'Rất tiếc, đã có lỗi kết nối tới hệ thống tư vấn AI.',
            isFinal: false
          }
        ]);
        return;
      }
      setMsgs(p => [
        ...p,
        {
          role: 'ai',
          text: data.reply || 'Cảm ơn bạn đã chia sẻ!',
          isFinal: !!data.is_ready
        }
      ]);
    } catch (err) {
      console.error('Error calling Chat API:', err);
      setMsgs(p => [
        ...p,
        {
          role: 'ai',
          text: 'Rất tiếc, đã có lỗi kết nối tới hệ thống tư vấn AI. Vui lòng thử lại.',
          isFinal: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '"Google Sans Flex", sans-serif', background: '#FAFAFA' }}>

      {/* SIDEBAR */}
      <div style={{ width: '300px', background: '#FFFFFF', borderRight: '1px solid rgba(6,4,14,0.06)', padding: '32px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#CBB0EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#1F1738' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24px', color: '#06040E', margin: 0 }}>AI Counselor</h3>
            <p style={{ fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: 'rgba(6,4,14,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '1.2px' }}>ACTIVE SESSION</p>
          </div>
        </div>

        {/* Tiến trình hội thoại */}
        {(() => {
          const userTurns = msgs.filter(m => m.role === 'user').length;
          const totalTurns = 10;
          const pct = Math.min(Math.round((userTurns / totalTurns) * 100), 100);
          return (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#5F6368' }}>Tiến trình thu thập</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0260FF' }}>{pct}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: '#F0F4FF', overflow: 'hidden' }}>
                <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, #0260FF, #40A2FF)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(6,4,14,0.4)', marginTop: '6px', margin: '6px 0 0 0' }}>
                {userTurns}/{totalTurns} lượt trả lời
              </p>
            </div>
          );
        })()}

        {/* Lịch sử hội thoại */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(6,4,14,0.35)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>
            Lịch sử trò chuyện
          </p>
          {msgs.filter(m => m.role === 'user').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: '13px', color: 'rgba(6,4,14,0.35)', lineHeight: '20px' }}>
                Chưa có tin nhắn nào.<br />Hãy bắt đầu trò chuyện!
              </p>
            </div>
          ) : (
            msgs.map((m, i) => {
              if (m.role !== 'user') return null;
              const turnNo = msgs.slice(0, i + 1).filter(x => x.role === 'user').length;
              const preview = m.text.length > 60 ? m.text.slice(0, 60) + '...' : m.text;
              return (
                <div key={i} style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: '#F8F9FC',
                  border: '1px solid rgba(6,4,14,0.06)',
                  cursor: 'default',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0260FF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Lượt {turnNo}
                  </div>
                  <div style={{ fontSize: '13px', color: '#06040E', lineHeight: '18px' }}>
                    {preview}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: '16px' }}>
          <button onClick={() => onNavigate('home')} className="gemini-pill" style={{
            color: '#D93025', fontWeight: 500, border: '1px solid rgba(217,48,37,0.2)', display: 'flex', justifyContent: 'center', margin: 0, width: '100%'
          }}>Thoát phiên trò chuyện</button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px' }}>
        <div className="gemini-card" style={{ flex: 1, borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(6,4,14,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
            <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', margin: 0 }}>Tư vấn Định hướng Hướng nghiệp</h2>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#FAFAFA' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%', padding: '16px 24px',
                  borderRadius: m.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                  background: m.role === 'user' ? '#0260FF' : '#FFFFFF',
                  color: m.role === 'user' ? '#FFFFFF' : '#06040E',
                  fontWeight: 400, fontSize: '16px', lineHeight: '24px', boxShadow: m.role === 'ai' ? '0 4px 16px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.08)',
                  border: m.role === 'ai' ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  whiteSpace: 'pre-wrap'
                }}>
                  <div style={{ marginBottom: m.isFinal ? '16px' : '0' }}>{m.text}</div>
                  {m.isFinal && (
                    <button className="gemini-gradient-btn" onClick={() => onNavigate('results')} style={{
                      height: '40px', padding: '0 20px', borderRadius: '20px', cursor: 'pointer',
                      fontWeight: 500, fontSize: '16px', lineHeight: '20px', display: 'inline-block'
                    }}>Xem Lộ trình chi tiết</button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#FFFFFF', padding: '16px 24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '8px', color: '#5F6368' }}>
                  <Loader2 className="animate-spin" size={18} />
                  <span>AI Counselor đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(0,0,0,0.04)', background: '#FFFFFF' }}>
            <form onSubmit={send} style={{ display: 'flex', gap: '16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '40px', padding: '8px 8px 8px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
              <input value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} placeholder="Nhập câu trả lời của bạn..." style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E',
              }}
              />
              <button type="submit" disabled={isLoading} className="gemini-gradient-btn" style={{
                width: '48px', height: '48px', borderRadius: '24px', cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.6 : 1
              }}>
                <Send size={20} strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;
