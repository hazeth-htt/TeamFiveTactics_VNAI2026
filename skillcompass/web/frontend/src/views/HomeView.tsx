import React, { useState, useEffect } from 'react';
import { View } from '../types';
import mascotHomeImg from '../app/mascot_home.png';
import { User } from 'lucide-react';

interface FloatingShape {
  type: string;
  size: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  animation: string;
  theme: string;
  opacity: number;
}

function HomeView({ onNavigate, isLoggedIn, onOpenAuth }: { onNavigate: (v: View) => void, isLoggedIn: boolean, onOpenAuth: () => void }) {
  const handleStart = () => isLoggedIn ? onNavigate('prechat') : onOpenAuth();

  const floatingShapes: FloatingShape[] = [
    // Left side particles
    { type: 'triangle', size: 24, top: '0px', left: '-120px', animation: 'float-irregular-1 15s infinite ease-in-out', theme: 'blue', opacity: 0.85 },
    { type: 'square', size: 18, top: '20px', left: '-180px', animation: 'float-irregular-2 18s infinite ease-in-out', theme: 'red', opacity: 0.75 },
    { type: 'circle', size: 12, top: '110px', left: '-160px', animation: 'float-irregular-3 12s infinite ease-in-out', theme: 'yellow', opacity: 0.9 },
    { type: 'triangle', size: 16, top: '180px', left: '-220px', animation: 'float-irregular-1 20s infinite ease-in-out alternate', theme: 'red', opacity: 0.85 },
    { type: 'square', size: 12, top: '240px', left: '-100px', animation: 'float-irregular-2 16s infinite ease-in-out alternate', theme: 'yellow', opacity: 0.8 },
    { type: 'circle', size: 8, top: '290px', left: '-140px', animation: 'float-irregular-3 14s infinite ease-in-out', theme: 'blue', opacity: 0.9 },
    
    // Right side particles
    { type: 'triangle', size: 20, top: '40px', right: '-120px', animation: 'float-irregular-1 16s infinite ease-in-out alternate', theme: 'yellow', opacity: 0.85 },
    { type: 'square', size: 14, top: '90px', right: '-190px', animation: 'float-irregular-2 19s infinite ease-in-out', theme: 'blue', opacity: 0.8 },
    { type: 'circle', size: 10, top: '150px', right: '-140px', animation: 'float-irregular-3 13s infinite ease-in-out', theme: 'red', opacity: 0.9 },
    { type: 'triangle', size: 18, top: '210px', right: '-240px', animation: 'float-irregular-1 22s infinite ease-in-out alternate', theme: 'blue', opacity: 0.75 },
    { type: 'square', size: 16, top: '270px', right: '-100px', animation: 'float-irregular-2 17s infinite ease-in-out alternate', theme: 'red', opacity: 0.85 },
    { type: 'circle', size: 14, top: '320px', right: '-170px', animation: 'float-irregular-3 15s infinite ease-in-out', theme: 'yellow', opacity: 0.9 },

    // Top and bottom bleeding particles
    { type: 'triangle', size: 14, top: '-30px', left: '15%', animation: 'float-irregular-1 17s infinite ease-in-out', theme: 'yellow', opacity: 0.9 },
    { type: 'square', size: 10, top: '-40px', right: '20%', animation: 'float-irregular-2 24s infinite ease-in-out alternate', theme: 'blue', opacity: 0.75 },
    { type: 'circle', size: 8, bottom: '-20px', left: '25%', animation: 'float-irregular-3 11s infinite ease-in-out alternate', theme: 'red', opacity: 0.9 },
    { type: 'triangle', size: 16, bottom: '-35px', right: '30%', animation: 'float-irregular-1 21s infinite ease-in-out alternate', theme: 'blue', opacity: 0.85 },
    { type: 'square', size: 12, bottom: '10px', left: '40%', animation: 'float-irregular-2 23s infinite ease-in-out', theme: 'yellow', opacity: 0.8 },
    { type: 'circle', size: 10, top: '-10px', left: '45%', animation: 'float-irregular-3 19s infinite ease-in-out', theme: 'red', opacity: 0.85 }
  ];

  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'red':
        return {
          bg: 'linear-gradient(135deg, rgba(255, 75, 75, 0.28) 0%, rgba(255, 143, 143, 0.28) 100%)',
          fill: 'url(#shape-red-gradient)'
        };
      case 'yellow':
        return {
          bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(245, 158, 11, 0.28) 100%)',
          fill: 'url(#shape-yellow-gradient)'
        };
      case 'blue':
      default:
        return {
          bg: 'linear-gradient(135deg, rgba(2, 96, 255, 0.28) 0%, rgba(64, 162, 255, 0.28) 100%)',
          fill: 'url(#shape-blue-gradient)'
        };
    }
  };

  return (
    <div
      className="view-container"
      style={{
        fontFamily: '"Google Sans Flex", sans-serif',
        background: 'transparent',
        minHeight: '100vh',
        paddingBottom: '64px'
      }}
    >
      {/* Floating Shapes Styles */}
      <style>{`
        @keyframes float-irregular-1 {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(25px, -10px) rotate(120deg); }
          66% { transform: translate(50px, 5px) rotate(240deg); }
          100% { transform: translate(0px, 0px) rotate(360deg); }
        }
        @keyframes float-irregular-2 {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(40px, 15px) rotate(-180deg); }
          100% { transform: translate(0px, 0px) rotate(-360deg); }
        }
        @keyframes float-irregular-3 {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          33% { transform: translate(20px, 20px) rotate(90deg); }
          66% { transform: translate(45px, -10px) rotate(180deg); }
          100% { transform: translate(0px, 0px) rotate(270deg); }
        }
      `}</style>

      {/* HERO */}
      <section className="hero-section" style={{ padding: '64px 48px', textAlign: 'center', width: 'fit-content', margin: '0 auto', position: 'relative' }}>
        
        {/* Hidden SVG for Gradient Definitions */}
        <svg width="0" height="0" style={{ display: 'block', position: 'absolute' }}>
          <defs>
            <linearGradient id="shape-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0260FF" />
              <stop offset="100%" stopColor="#40A2FF" />
            </linearGradient>
            <linearGradient id="shape-red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4B4B" />
              <stop offset="100%" stopColor="#FF8F8F" />
            </linearGradient>
            <linearGradient id="shape-yellow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Shapes */}
        {floatingShapes.map((s, idx) => {
          const posStyle: React.CSSProperties = {
            position: 'absolute',
            animation: s.animation,
            pointerEvents: 'none',
            opacity: s.opacity,
            zIndex: 0,
            ...(s.top && { top: s.top }),
            ...(s.bottom && { bottom: s.bottom }),
            ...(s.left && { left: s.left }),
            ...(s.right && { right: s.right }),
          };

          const themeStyle = getThemeStyles(s.theme || 'blue');

          return (
            <div key={idx} style={posStyle}>
              {s.type === 'triangle' && (
                <svg width={s.size} height={s.size} viewBox="0 0 24 24">
                  <path d="M12 3L3 20h18L12 3z" fill={themeStyle.fill} stroke={themeStyle.fill} strokeWidth="4" strokeLinejoin="round" />
                </svg>
              )}
              {s.type === 'square' && (
                <div style={{ width: `${s.size}px`, height: `${s.size}px`, borderRadius: '4px', background: themeStyle.bg, border: 'none' }} />
              )}
              {s.type === 'circle' && (
                <div style={{ width: `${s.size}px`, height: `${s.size}px`, borderRadius: '50%', background: themeStyle.bg, border: 'none' }} />
              )}
            </div>
          );
        })}

        <h1 className="hero-title" style={{
          fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 500, fontSize: '64px', lineHeight: '72px', color: '#06040E', marginBottom: '24px', letterSpacing: '-1px'
        }}>
          Khám phá sự nghiệp<br />dành riêng cho bạn
        </h1>
        <p className="hero-description" style={{
          fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', color: '#5F6368', margin: '0 auto 40px', maxWidth: '640px',
        }}>
          Career Pilot phân tích năng lực cốt lõi, khớp với xu hướng thị trường,
          và tạo lộ trình phát triển cá nhân hóa chỉ trong vài phút.
        </p>
        <div className="hero-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
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
      <div className="cards-container" style={{ padding: '0 48px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Card 1 */}
        <section className="gemini-card responsive-card" style={{
          borderRadius: '20px', padding: '64px',
          display: 'flex', gap: '64px', alignItems: 'center',
          position: 'relative'
        }}>
          {/* Section corner shapes: Left */}
          <div style={{ position: 'absolute', top: '20px', left: '-35px', animation: 'float-irregular-1 14s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M12 3L3 20h18L12 3z" fill="url(#shape-red-gradient)" stroke="url(#shape-red-gradient)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '55px', left: '-55px', animation: 'float-irregular-2 16s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(2, 96, 255, 0.28) 0%, rgba(64, 162, 255, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: '80px', left: '-25px', animation: 'float-irregular-3 12s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(245, 158, 11, 0.28) 100%)', border: 'none' }} />
          </div>

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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={mascotHomeImg.src} alt="Mascot" style={{ width: '100%', height: 'auto', maxHeight: '360px', objectFit: 'contain' }} />
          </div>
        </section>

        {/* Card 2 (Restored AI Conversation Section) */}
        <section className="gemini-card responsive-card" style={{
          borderRadius: '20px', padding: '64px',
          display: 'flex', gap: '64px', alignItems: 'center',
          position: 'relative'
        }}>
          {/* Section corner shapes: Right */}
          <div style={{ position: 'absolute', top: '30px', right: '-45px', animation: 'float-irregular-1 15s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 3L3 20h18L12 3z" fill="url(#shape-yellow-gradient)" stroke="url(#shape-yellow-gradient)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '65px', right: '-25px', animation: 'float-irregular-2 18s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(255, 75, 75, 0.28) 0%, rgba(255, 143, 143, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: '90px', right: '-55px', animation: 'float-irregular-3 13s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(2, 96, 255, 0.28) 0%, rgba(64, 162, 255, 0.28) 100%)', border: 'none' }} />
          </div>

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
                Tôi thích ngồi mò mẫm các lỗi logic trong hệ thống và tìm cách tối ưu chúng.
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

        {/* Testimonials Section */}
        <section className="testimonial-section" style={{ marginTop: '32px', marginBottom: '32px', position: 'relative' }}>
          {/* Section corner shapes: Left */}
          <div style={{ position: 'absolute', top: '10px', left: '-40px', animation: 'float-irregular-1 16s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M12 3L3 20h18L12 3z" fill="url(#shape-blue-gradient)" stroke="url(#shape-blue-gradient)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '40px', left: '-60px', animation: 'float-irregular-2 14s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(245, 158, 11, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: '70px', left: '-30px', animation: 'float-irregular-3 15s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255, 75, 75, 0.28) 0%, rgba(255, 143, 143, 0.28) 100%)', border: 'none' }} />
          </div>

          {/* Blue gradient definition for stars */}
          <svg width="0" height="0" style={{ display: 'block', position: 'absolute' }}>
            <defs>
              <linearGradient id="star-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="9.29%" stopColor="#0260FF" />
                <stop offset="48.23%" stopColor="#40A2FF" />
                <stop offset="82.56%" stopColor="#A8BEFF" />
              </linearGradient>
            </defs>
          </svg>

          <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '8px', textAlign: 'center' }}>
            Học sinh & Phụ huynh nói gì?
          </h2>
          <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#5F6368', marginBottom: '40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
            Hàng ngàn bạn trẻ đã tìm thấy định hướng học tập và sự nghiệp phù hợp nhờ sự phân tích thấu cảm của Career Pilot.
          </p>
          <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              {
                name: 'Nguyễn Tiến Đạt',
                role: 'Học sinh lớp 12 - THPT Chuyên KHTN',
                review: 'Em từng rất mông lung giữa Công nghệ thông tin và Thiết kế đồ họa. Cuộc hội thoại với AI thực sự sâu sắc, giúp em nhận ra em đam mê giải quyết các bài toán logic hơn là mỹ thuật trực quan. Lộ trình tự học AI gợi ý vô cùng chi tiết!'
              },
              {
                name: 'Trần Khánh Vy',
                role: 'Sinh viên năm nhất - Đại học Ngoại Thương',
                review: 'Hồi trước em làm khảo sát MBTI hay Holland thấy lý thuyết quá. Trợ lý Career Pilot hỏi những câu rất tự nhiên, khai thác thói quen hàng ngày của em để suy luận năng lực lõi. Kết quả gợi ý ngành phân tích dữ liệu cực kỳ khớp.'
              },
              {
                name: 'Cô Nguyễn Thị Mai',
                role: 'Phụ huynh học sinh - Quận 3, TP.HCM',
                review: 'Là phụ huynh, tôi rất lo lắng khi con không biết chọn ngành gì. Career Pilot không chỉ hướng nghiệp đại học mà còn gợi ý cả những con đường học nghề, chứng chỉ ngắn hạn rất thực tế. Giúp gia đình tôi cất đi được gánh nặng lo âu.'
              }
            ].map((t, idx) => (
              <div
                key={idx}
                className="gemini-card"
                style={{
                  borderRadius: '20px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  transition: 'all 0.25s ease',
                  cursor: 'default'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,.05)';
                }}
              >
                {/* User Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: '#FFFFFF', border: '1px solid rgba(6,4,14,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: '#5F6368', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}>
                    <User size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 500, fontSize: '16px', lineHeight: '22px', color: '#06040E', margin: 0 }}>{t.name}</h4>
                    <p style={{ fontSize: '13px', lineHeight: '18px', color: '#5F6368', margin: '4px 0 0 0' }}>{t.role}</p>
                  </div>
                </div>
                {/* 5 Stars Rating */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="url(#star-blue-gradient)" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                </div>
                {/* Review Text */}
                <p style={{
                  fontSize: '15px', lineHeight: '22px', color: '#5F6368', margin: 0,
                  fontStyle: 'italic', flex: 1
                }}>
                  "{t.review}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy Quote Section */}
        <section className="philosophy-section" style={{
          marginTop: '32px',
          marginBottom: '64px',
          borderRadius: '24px',
          padding: '64px 48px',
          background: 'linear-gradient(53deg, #0260FF 9.29%, #40A2FF 48.23%, #A8BEFF 82.56%)',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(2, 96, 255, 0.12)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background shapes */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)' }} />

          {/* SVG Quote Icon as Background Element */}
          <svg width="120" height="120" viewBox="0 0 24 24" fill="rgba(255,255,255,0.06)" stroke="none" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            <path d="M3 21h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v2a4 4 0 0 0 4 4H3zm11 0h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-3v2a4 4 0 0 0 4 4h-3z" transform="rotate(180 12 12)" />
          </svg>

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
            {/* Triết lý nằm bên trên quote */}
            <span style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '16px',
              fontFamily: '"Google Sans Flex", sans-serif',
              fontStyle: 'normal'
            }}>
              Triết lý định hướng Career Pilot
            </span>

            <blockquote className="philosophy-quote" style={{
              fontSize: '18px',
              lineHeight: '28px',
              fontWeight: 400,
              margin: 0,
              fontFamily: '"Google Sans Flex", sans-serif',
              fontStyle: 'normal',
              letterSpacing: '-0.1px'
            }}>
              "Sự nghiệp thành công không xây dựng trên xu thế nhất thời, mà được kiến tạo từ sự thấu hiểu năng lực bản thân và nhịp đập thực tế của thị trường lao động."
            </blockquote>
          </div>
        </section>

      </div>
    </div>
  );
}

export default HomeView;
