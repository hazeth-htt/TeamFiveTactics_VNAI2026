import React, { useState, useEffect } from 'react';
import { View } from '../types';
import mascotImg from '../app/mascot.png';

function HomeView({ onNavigate, isLoggedIn, onOpenAuth }: { onNavigate: (v: View) => void, isLoggedIn: boolean, onOpenAuth: () => void }) {
  const handleStart = () => isLoggedIn ? onNavigate('prechat') : onOpenAuth();

  return (
    <div style={{ fontFamily: '"Google Sans Flex", sans-serif', background: '#FAFAFA', minHeight: '100vh', paddingBottom: '64px' }}>
      {/* HERO */}
      <section style={{ padding: '64px 48px', textAlign: 'center', width: 'fit-content', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 500, fontSize: '64px', lineHeight: '72px', color: '#06040E', marginBottom: '24px', letterSpacing: '-1px'
        }}>
          Khám phá sự nghiệp<br />dành riêng cho bạn.
        </h1>
        <p style={{
          fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', color: '#5F6368', margin: '0 auto 40px', maxWidth: '640px',
        }}>
          Career Pilot phân tích năng lực cốt lõi, khớp với xu hướng thị trường,
          và tạo lộ trình phát triển cá nhân hóa chỉ trong vài phút.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="gemini-gradient-btn" onClick={handleStart} style={{
            height: '56px', padding: '0 32px', borderRadius: '28px', cursor: 'pointer',
            fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '20px'
          }}>
            Bắt đầu định hướng cùng AI
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('market')} style={{
            height: '56px', padding: '0 32px', borderRadius: '28px', cursor: 'pointer',
            fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '20px',
            color: '#06040E', background: '#FFFFFF', border: '1px solid rgba(6,4,14,0.1)'
          }}>
            Xem Xu hướng
          </button>
        </div>
      </section>

      {/* SECTION CARDS */}
      <div style={{ padding: '0 48px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Card 1 */}
        <section className="gemini-card" style={{
          borderRadius: '20px', padding: '64px',
          display: 'flex', gap: '64px', alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '16px' }}>
              Xây dựng hồ sơ dễ dàng
            </h2>
            <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#5F6368', marginBottom: '32px' }}>
              Hệ thống thu thập thông tin cơ bản để hiểu rõ bạn. AI chỉ hỏi những câu trọng tâm và cần thiết nhất.
            </p>
            <button className="btn-secondary" onClick={handleStart} style={{
              height: '48px', padding: '0 28px', borderRadius: '24px', border: '1px solid rgba(6,4,14,0.1)', cursor: 'pointer',
              fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', background: '#FFFFFF', transition: 'background 0.2s'
            }}>Tạo hồ sơ</button>
          </div>
          <div style={{ flex: 1, height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mascotImg.src} alt="Mascot" style={{ height: '100%', objectFit: 'contain' }} />
          </div>
        </section>

        {/* Card 2 (Restored AI Conversation Section) */}
        <section className="gemini-card" style={{
          borderRadius: '20px', padding: '64px',
          display: 'flex', gap: '64px', alignItems: 'center'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'linear-gradient(53deg, #0260FF, #A8BEFF)' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>AI Assistant</div>
                  <div style={{ fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: 'rgba(6,4,14,0.5)', textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '4px' }}>ACTIVE NOW</div>
                </div>
              </div>
              <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.04)', color: '#06040E', fontSize: '16px', lineHeight: '20px', marginBottom: '16px', width: '85%' }}>
                Bạn thường cảm thấy mất khái niệm thời gian khi làm hoạt động nào nhất?
              </div>
              <div style={{ background: '#0260FF', padding: '16px', borderRadius: '20px', color: '#FFFFFF', fontSize: '16px', lineHeight: '20px', marginLeft: 'auto', width: '85%' }}>
                Tôi thích ngồi mò mẫm các lỗi logic trong hệ thống...
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '16px' }}>
              Trò chuyện sâu sắc,<br />insight giá trị
            </h2>
            <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#5F6368', marginBottom: '32px' }}>
              Trải nghiệm cuộc hội thoại thực sự thấu hiểu bạn. Trợ lý AI sẽ khai thác những tiềm năng mà bạn chưa từng nhận ra.
            </p>
            <button className="gemini-gradient-btn" onClick={() => onNavigate('chat')} style={{
              height: '48px', padding: '0 28px', borderRadius: '24px', cursor: 'pointer',
              fontWeight: 500, fontSize: '16px', lineHeight: '20px'
            }}>
              Thử Chat AI
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

export default HomeView;
