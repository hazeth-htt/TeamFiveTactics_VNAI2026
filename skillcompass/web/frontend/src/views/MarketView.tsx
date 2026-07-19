import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { View } from '../types';
import CustomSelect from '../components/CustomSelect';
import { Loader2, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://teamfivetactics-vnai2026-1.onrender.com';

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

function MarketView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const floatingShapes: FloatingShape[] = [
    // Scattered top area particles (Hero-like frame around the title)
    { type: 'triangle', size: 24, top: '-20px', left: '-80px', animation: 'float-irregular-1 15s infinite ease-in-out', theme: 'blue', opacity: 0.85 },
    { type: 'square', size: 16, top: '10px', right: '-80px', animation: 'float-irregular-2 18s infinite ease-in-out', theme: 'red', opacity: 0.75 },
    { type: 'circle', size: 10, top: '80px', left: '-120px', animation: 'float-irregular-3 12s infinite ease-in-out', theme: 'yellow', opacity: 0.9 },
    { type: 'triangle', size: 18, top: '140px', right: '-120px', animation: 'float-irregular-1 20s infinite ease-in-out alternate', theme: 'blue', opacity: 0.85 },
    { type: 'square', size: 12, top: '-30px', left: '15%', animation: 'float-irregular-2 22s infinite ease-in-out alternate', theme: 'yellow', opacity: 0.8 },
    { type: 'circle', size: 8, top: '-40px', right: '20%', animation: 'float-irregular-3 14s infinite ease-in-out', theme: 'red', opacity: 0.9 }
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

  const [region, setRegion] = useState('Toàn quốc');
  const [topIndustries, setTopIndustries] = useState<any[]>([]);
  const [regionalTrends, setRegionalTrends] = useState<any>({ rising: [], falling: [] });
  const [isLoading, setIsLoading] = useState(true);

  // States cho Popup Chi tiết Ngành học
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<any | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/career/trends?region=${encodeURIComponent(region)}`);
        const data = await res.json();
        if (data.success || data.topIndustries) {
          setTopIndustries(data.topIndustries || []);
          setRegionalTrends(data.regionalTrends || { rising: [], falling: [] });
        }
      } catch (err) {
        console.error('Error fetching trends:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrends();
  }, [region]);

  const handleJobClick = async (jobName: string) => {
    setSelectedJob(jobName);
    setIsDetailLoading(true);
    setJobDetail(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/career/detail?name=${encodeURIComponent(jobName)}`);
      const data = await res.json();
      if (data.success) {
        setJobDetail(data);
      }
    } catch (err) {
      console.error('Error fetching job detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="view-container" style={{ minHeight: '100vh', background: 'transparent', padding: '64px 48px', fontFamily: '"Google Sans Flex", sans-serif', position: 'relative', overflow: 'hidden' }}>
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

      {/* Page Header Floating Shapes */}
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

      <div className="view-max-width" style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Section 1: Trending Industries */}
        <section style={{ marginBottom: '64px', position: 'relative' }}>
          {/* Section corner shapes: Left */}
          <div style={{ position: 'absolute', top: '40px', left: '-45px', animation: 'float-irregular-1 14s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M12 3L3 20h18L12 3z" fill="url(#shape-red-gradient)" stroke="url(#shape-red-gradient)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '75px', left: '-65px', animation: 'float-irregular-2 16s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(2, 96, 255, 0.28) 0%, rgba(64, 162, 255, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: '100px', left: '-35px', animation: 'float-irregular-3 12s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(245, 158, 11, 0.28) 100%)', border: 'none' }} />
          </div>

          <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '32px' }}>
            Top Lĩnh vực thịnh hành
          </h2>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 className="animate-spin" size={32} color="#0260FF" />
            </div>
          ) : (
            <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {topIndustries.map((ind, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', transition: 'all .25s ease', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                  <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div
                      onClick={() => setSelectedIndustry(ind)}
                      style={{
                        background: 'linear-gradient(53deg, #0260FF 9.29%, #40A2FF 48.23%, #A8BEFF 82.56%)',
                        padding: '16px 24px', cursor: 'pointer',
                        height: '88px', display: 'flex', alignItems: 'center'
                      }}
                    >
                      <h3 style={{ fontWeight: 600, fontSize: '18px', lineHeight: '24px', margin: 0, color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>{ind.title}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            whiteSpace: 'nowrap',
                            marginLeft: '12px',
                            textDecoration: 'none',
                            transition: 'text-decoration 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseOut={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          Xem tất cả &rarr;
                        </span>
                      </h3>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                      {ind.jobs && ind.jobs.map((job: string, idx: number) => (
                        <div
                          key={job}
                          onClick={() => handleJobClick(job)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF',
                            padding: '12px 18px', borderRadius: '14px', border: '1px solid #EEF2F7',
                            transition: 'all .2s ease', cursor: 'pointer', minHeight: '68px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#0260FF';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(2,96,255,0.08)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#EEF2F7';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: '20px', color: '#0260FF' }}>{idx + 1}</div>
                          <div style={{ fontWeight: 500, fontSize: '15px', lineHeight: '20px', color: '#06040E' }}>{job}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Regional Trends */}
        <section className="gemini-card responsive-card" style={{ marginBottom: '64px', borderRadius: '20px', padding: '48px', position: 'relative' }}>
          {/* Section corner shapes: Right */}
          <div style={{ position: 'absolute', top: '40px', right: '-45px', animation: 'float-irregular-1 15s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 3L3 20h18L12 3z" fill="url(#shape-yellow-gradient)" stroke="url(#shape-yellow-gradient)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '75px', right: '-25px', animation: 'float-irregular-2 18s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(255, 75, 75, 0.28) 0%, rgba(255, 143, 143, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: '100px', right: '-55px', animation: 'float-irregular-3 13s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(2, 96, 255, 0.28) 0%, rgba(64, 162, 255, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E' }}>
              Xu hướng theo khu vực
            </h2>
            <div style={{ width: '200px' }}>
              <CustomSelect
                value={region}
                onChange={setRegion}
                options={['Toàn quốc', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']}
                style={{ height: '48px', padding: '0 16px 0 20px', border: '1px solid rgba(6,4,14,0.1)', fontWeight: 500 }}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 className="animate-spin" size={32} color="#0260FF" />
            </div>
          ) : (
            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              {/* Column 1: Rising */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)', padding: '20px 24px' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Đang tăng trưởng (Tuyển dụng cao)
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                    </h3>
                  </div>
                  <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {regionalTrends.rising && regionalTrends.rising.map((j: any) => (
                      <div
                        key={j.n}
                        onClick={() => handleJobClick(j.n)}
                        style={{
                          padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7',
                          background: '#FFFFFF', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                          const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                          if (arrow) arrow.style.transform = 'translateX(4px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                          if (arrow) arrow.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600, padding: '4px 10px', background: '#F3F4F6', color: '#6B7280', borderRadius: '999px', border: 'none', letterSpacing: 0 }}>{j.field}</span>
                          <span style={{ fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{j.n}</span>
                        </div>
                        <ArrowRight className="arrow-icon" size={18} style={{ color: '#9CA3AF', transition: 'transform 0.2s ease' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Falling */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #D93025 0%, #FF4B2B 100%)', padding: '20px 24px' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Tuyển dụng ít (Cạnh tranh khốc liệt)
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
                    </h3>
                  </div>
                  <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {regionalTrends.falling && regionalTrends.falling.map((j: any) => (
                      <div
                        key={j.n}
                        onClick={() => handleJobClick(j.n)}
                        style={{
                          padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7',
                          background: '#FFFFFF', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', transition: 'all .2s ease', cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                          const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                          if (arrow) arrow.style.transform = 'translateX(4px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                          const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                          if (arrow) arrow.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600, padding: '4px 10px', background: '#F3F4F6', color: '#6B7280', borderRadius: '999px', border: 'none', letterSpacing: 0 }}>{j.field}</span>
                          <span style={{ fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{j.n}</span>
                        </div>
                        <ArrowRight className="arrow-icon" size={18} style={{ color: '#9CA3AF', transition: 'transform 0.2s ease' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: CTA */}
        <section className="gemini-card responsive-card" style={{ borderRadius: '20px', padding: '64px', textAlign: 'center', position: 'relative' }}>
          {/* Section corner shapes: Left */}
          <div style={{ position: 'absolute', top: '20px', left: '-35px', animation: 'float-irregular-1 16s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M12 3L3 20h18L12 3z" fill="url(#shape-blue-gradient)" stroke="url(#shape-blue-gradient)" strokeWidth="4" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: '50px', left: '-55px', animation: 'float-irregular-2 14s infinite ease-in-out', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(245, 158, 11, 0.28) 100%)', border: 'none' }} />
          </div>
          <div style={{ position: 'absolute', top: '80px', left: '-25px', animation: 'float-irregular-3 15s infinite ease-in-out alternate', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255, 75, 75, 0.28) 0%, rgba(255, 143, 143, 0.28) 100%)', border: 'none' }} />
          </div>

          <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#10242F', marginBottom: '16px' }}>
            Phân vân giữa các lựa chọn?
          </h2>
          <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#5F6368', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Đừng đoán mò. Hãy để AI phân tích năng lực lõi của bạn và<br />gợi ý ngành nghề phù hợp nhất.
          </p>
          <button className="gemini-gradient-btn" onClick={() => onNavigate('prechat')} style={{
            height: '56px', padding: '0 32px', borderRadius: '28px', cursor: 'pointer',
            fontWeight: 500, fontSize: '16px', lineHeight: '20px'
          }}>
            Tư vấn bằng AI ngay
          </button>
        </section>

        {/* Job Detail Modal Popup */}
        {selectedJob && typeof document !== 'undefined' && createPortal(
          <div className="modal-wrapper" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, padding: '24px'
          }}>
            <div className="modal-content" style={{
              background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '750px',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)'
            }}>

              {/* Close Button - Cố định trên wrapper chính */}
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  position: 'absolute', top: '24px', right: '24px', border: 'none',
                  background: 'none', fontSize: '24px', cursor: 'pointer', color: '#5F6368',
                  padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all 0.2s', width: '40px', height: '40px',
                  backgroundColor: '#F3F4F6', zIndex: 10
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              >
                &times;
              </button>

              {isDetailLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', gap: '16px', padding: '40px' }}>
                  <Loader2 className="animate-spin" size={36} color="#0260FF" />
                  <span style={{ fontFamily: '"Google Sans Flex", sans-serif', fontSize: '16px', color: '#5F6368', fontWeight: 500 }}>Đang tải lộ trình và cây kỹ năng của {selectedJob}...</span>
                </div>
              ) : jobDetail ? (
                <>
                  {/* Fixed Header: Chứa thẻ tag và tên nghề nghiệp cố định */}
                  <div className="modal-header" style={{ padding: '40px 80px 20px 40px', borderBottom: '1px solid rgba(6,4,14,0.06)', background: '#FFFFFF' }}>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: '"Google Sans Flex", sans-serif',
                      fontSize: '13px', fontWeight: 700, color: '#0260FF',
                      textTransform: 'uppercase', letterSpacing: '1px', background: '#F0F4FF',
                      padding: '6px 12px', borderRadius: '20px'
                    }}>
                      {jobDetail.track_type}
                    </span>

                    <h3 style={{ fontFamily: '"Google Sans Flex", sans-serif', fontWeight: 600, fontSize: '28px', lineHeight: '34px', color: '#06040E', marginTop: '16px', marginBottom: 0 }}>
                      {jobDetail.career_track}
                    </h3>
                  </div>

                  {/* Scrollable Content Area: Chứa mô tả, lương, cây kỹ năng, lộ trình thăng tiến */}
                  <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px', fontFamily: '"Google Sans Flex", sans-serif' }}>
                    <p style={{ fontSize: '15px', lineHeight: '24px', color: '#5F6368', marginBottom: '24px' }}>
                      {jobDetail.description}
                    </p>

                    <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', padding: '16px 20px', background: '#F8F9FA', borderRadius: '16px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>LƯƠNG TRUNG BÌNH THỊ TRƯỜNG</span>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#06040E', marginTop: '4px' }}>
                          {jobDetail.avg_salary_min ? `${(jobDetail.avg_salary_min / 1000000).toFixed(0)}tr` : 'Thỏa thuận'} - {jobDetail.avg_salary_max ? `${(jobDetail.avg_salary_max / 1000000).toFixed(0)}tr` : 'Thỏa thuận'} VND/tháng
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>LỘ TRÌNH ĐÀO TẠO ĐỀ XUẤT</span>
                        <div style={{ fontSize: '15px', fontWeight: 500, color: '#06040E', marginTop: '4px', lineHeight: '20px' }}>
                          {jobDetail.education_route || 'Đại học / Tự học & Đào tạo ngắn hạn'}
                        </div>
                      </div>
                    </div>

                    {/* Skill Tree */}
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '16px', color: '#06040E', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                        Cây Kỹ năng (Skill Tree)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#4B5563', marginBottom: '8px', textTransform: 'uppercase' }}>Kỹ năng nền tảng:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {jobDetail.skill_tree.fundamentals && jobDetail.skill_tree.fundamentals.map((s: string) => (
                              <span key={s} style={{ background: '#F3F4F6', color: '#4B5563', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', border: '1px solid #E5E7EB' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0260FF', marginBottom: '8px', textTransform: 'uppercase' }}>Công nghệ cốt lõi:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {jobDetail.skill_tree.core_technologies && jobDetail.skill_tree.core_technologies.map((s: string) => (
                              <span key={s} style={{ background: '#F0F4FF', color: '#0260FF', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', border: '1px solid rgba(2,96,255,0.1)' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        {jobDetail.skill_tree.advanced_skills && jobDetail.skill_tree.advanced_skills.length > 0 && (
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', marginBottom: '8px', textTransform: 'uppercase' }}>Kỹ năng nâng cao:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {jobDetail.skill_tree.advanced_skills.map((s: string) => (
                                <span key={s} style={{ background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', border: '1px solid rgba(5,150,105,0.1)' }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Progression */}
                    {jobDetail.role_progression && jobDetail.role_progression.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '16px', color: '#06040E', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
                          Lộ trình Thăng tiến vị trí (Career Path)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {jobDetail.role_progression.map((step: any, idx: number) => (
                            <div key={idx} style={{ background: '#FAFBFD', padding: '16px', borderRadius: '14px', borderLeft: '4px solid #0260FF', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontWeight: 600, fontSize: '15px', color: '#06040E' }}>
                                <span style={{ color: '#0260FF', marginRight: '8px' }}>[{step.level}]</span>
                                {step.title}
                              </div>
                              <div style={{ fontSize: '13px', color: '#5F6368', marginTop: '6px', lineHeight: '20px' }}>
                                {step.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Typical Employers */}
                    {jobDetail.typical_employers && jobDetail.typical_employers.length > 0 && (
                      <div style={{ marginTop: '24px' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '15px', color: '#06040E', marginBottom: '12px' }}>
                          Doanh nghiệp tuyển dụng tiêu biểu:
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {jobDetail.typical_employers.map((emp: string) => (
                            <span key={emp} style={{ background: '#FFFBEB', color: '#D97706', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', border: '1px solid rgba(217,119,6,0.1)', fontWeight: 500 }}>
                              {emp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#D93025', fontWeight: 500 }}>
                  Không thể lấy thông tin chi tiết. Vui lòng thử lại sau.
                </div>
              )}

            </div>
          </div>
        , document.body)}
        {/* Industry Jobs List Modal Popup */}
        {selectedIndustry && typeof document !== 'undefined' && createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9998, padding: '24px'
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '600px',
              maxHeight: '80vh', overflowY: 'auto', padding: '40px', position: 'relative',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)'
            }}>

              {/* Close Button */}
              <button
                onClick={() => setSelectedIndustry(null)}
                style={{
                  position: 'absolute', top: '24px', right: '24px', border: 'none',
                  background: 'none', fontSize: '24px', cursor: 'pointer', color: '#5F6368',
                  padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', transition: 'all 0.2s', width: '40px', height: '40px',
                  backgroundColor: '#F3F4F6'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
              >
                &times;
              </button>

              <div style={{ fontFamily: '"Google Sans Flex", sans-serif' }}>
                <h3 style={{ fontWeight: 600, fontSize: '24px', color: '#06040E', marginBottom: '8px' }}>
                  Lĩnh vực: {selectedIndustry.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#5F6368', marginBottom: '24px' }}>
                  Chọn một ngành nghề để xem chi tiết cây kỹ năng và lộ trình thăng tiến:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedIndustry.allJobs && selectedIndustry.allJobs.map((job: string) => (
                    <div
                      key={job}
                      onClick={() => {
                        setSelectedIndustry(null);
                        handleJobClick(job);
                      }}
                      style={{
                        padding: '16px 20px', borderRadius: '14px', border: '1px solid #EEF2F7',
                        background: '#F9FAFB', cursor: 'pointer', fontWeight: 500, fontSize: '16px',
                        color: '#06040E', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#0260FF';
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(2,96,255,0.06)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#EEF2F7';
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span>{job}</span>
                      <span style={{ color: '#0260FF', fontSize: '20px' }}>&rarr;</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        , document.body)}

      </div>
    </div>
  );
}

export default MarketView;
