import React, { useState, useEffect } from 'react';
import { View } from '../types';

function ResultsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const recommendedJobs = [
    { title: 'Data Scientist', score: 95, skills: ['Lập trình Python', 'Học Máy (Machine Learning)', 'Thống kê cơ bản', 'Truy vấn SQL', 'Trực quan hóa dữ liệu'] },
    { title: 'Product Manager', score: 88, skills: ['Quản lý dự án Agile/Scrum', 'Phân tích yêu cầu', 'Kiến thức về UX/UI', 'Giao tiếp & Đàm phán', 'Phân tích dữ liệu sản phẩm'] },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '64px 48px', fontFamily: '"Google Sans Flex", sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '48px' }}>
          Lộ trình của bạn
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Competency */}
          <div className="gemini-card" style={{ borderRadius: '20px', padding: '40px' }}>
            <h3 className="gemini-gradient-text" style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24px', marginBottom: '32px' }}>Năng lực Cốt lõi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[{ n: 'Tư duy Logic', v: 92 }, { n: 'Sáng tạo', v: 84 }, { n: 'Kỹ thuật', v: 80 }].map(s => (
                <div key={s.n}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#06040E', fontWeight: 400, fontSize: '16px', lineHeight: '20px' }}>
                    <span>{s.n}</span> <span style={{ color: '#0260FF', fontWeight: 500 }}>{s.v}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: '#F0F4FF' }}>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(53deg, #0260FF, #40A2FF)', width: `${s.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jobs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {recommendedJobs.map((j, i) => (
              <div key={i} className="gemini-card" style={{
                borderRadius: '20px', padding: '32px 40px',
                display: 'flex', flexDirection: 'column', transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: 500, fontSize: '24px', lineHeight: '28px', color: '#06040E', marginBottom: '12px' }}>{j.title}</h4>
                    <button
                      onClick={() => toggleExpand(i)}
                      className="gemini-pill" style={{ height: '40px', padding: '0 20px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', background: expandedIndices.includes(i) ? '#F0F4FF' : '#FFFFFF', cursor: 'pointer', margin: 0, transition: 'all 0.2s' }}>
                      Các kĩ năng cần học
                    </button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="gemini-gradient-text" style={{ fontWeight: 500, fontSize: '36px', lineHeight: '40px' }}>{j.score}%</div>
                    <p style={{ fontWeight: 700, fontSize: '12px', lineHeight: '16px', color: 'rgba(0,0,0,0.5)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Độ phù hợp</p>
                  </div>
                </div>

                {/* Expandable Skills Section */}
                {expandedIndices.includes(i) && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s' }}>
                    <h5 style={{ fontWeight: 500, fontSize: '16px', color: '#06040E', marginBottom: '12px' }}>Lộ trình kĩ năng bạn cần trang bị:</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {j.skills.map(skill => (
                        <span key={skill} style={{ background: '#F8F9FA', padding: '8px 16px', borderRadius: '16px', fontSize: '14px', color: '#5F6368', border: '1px solid rgba(0,0,0,0.04)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button className="gemini-pill" onClick={() => onNavigate('home')} style={{ marginTop: '48px', height: '56px', padding: '0 32px', borderRadius: '28px', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', background: '#FFFFFF', cursor: 'pointer' }}>Trở về Trang chủ</button>
      </div>
    </div>
  );
}

export default ResultsView;
