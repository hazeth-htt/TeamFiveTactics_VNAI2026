import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { Send } from 'lucide-react';

function ChatView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai' as const, text: 'Xin chào! Hãy kể cho tôi nghe về những công việc hoặc sở thích khiến bạn say mê đến quên cả thời gian nhé.', isFinal: false }
  ]);
  const [input, setInput] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const next = [...msgs, { role: 'user' as const, text: input, isFinal: false }];
    setMsgs(next);
    setInput('');
    setTimeout(() => {
      const userMsgCount = next.filter(m => m.role === 'user').length;
      if (userMsgCount >= 3) {
        setMsgs(p => [...p, { role: 'ai', text: 'Tuyệt vời. Tôi đã thu thập đủ dữ liệu năng lực và sự kỳ vọng của bạn. Bạn đã sẵn sàng xem lộ trình sự nghiệp chi tiết do AI tổng hợp chưa?', isFinal: true }]);
      } else {
        setMsgs(p => [...p, { role: 'ai', text: 'Thật thú vị! Bạn có thể lấy một ví dụ cụ thể mà bạn đã từng trải qua không?', isFinal: false }]);
      }
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '"Google Sans Flex", sans-serif', background: '#FAFAFA' }}>

      {/* SIDEBAR */}
      <div style={{ width: '300px', background: '#FFFFFF', borderRight: '1px solid rgba(6,4,14,0.06)', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#CBB0EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#1F1738' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24px', color: '#06040E', margin: 0 }}>AI Counselor</h3>
            <p style={{ fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: 'rgba(6,4,14,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '1.2px' }}>ACTIVE SESSION</p>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => onNavigate('home')} className="gemini-pill" style={{
            color: '#D93025', fontWeight: 500, border: '1px solid rgba(217,48,37,0.2)', display: 'flex', justifyContent: 'center', margin: 0
          }}>Thoát phiên trò chuyện</button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px' }}>
        <div className="gemini-card" style={{ flex: 1, borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(6,4,14,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
            <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', margin: 0 }}>Session Details</h2>
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
                  fontWeight: 400, fontSize: '16px', lineHeight: '20px', boxShadow: m.role === 'ai' ? '0 4px 16px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.08)',
                  border: m.role === 'ai' ? '1px solid rgba(0,0,0,0.06)' : 'none'
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
          </div>

          {/* Input */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(0,0,0,0.04)', background: '#FFFFFF' }}>
            <form onSubmit={send} style={{ display: 'flex', gap: '16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '40px', padding: '8px 8px 8px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập câu trả lời của bạn..." style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E',
              }}
              />
              <button type="submit" className="gemini-gradient-btn" style={{
                width: '48px', height: '48px', borderRadius: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
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
