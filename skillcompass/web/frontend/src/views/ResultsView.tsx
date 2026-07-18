import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://teamfivetactics-vnai2026-1.onrender.com';

function ResultsView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      setIsLoading(true);
      try {
        const sid = typeof window !== 'undefined' ? (sessionStorage.getItem('skillcompass_session_id') || 'session_default') : 'session_default';
        const res = await fetch(`${BACKEND_URL}/api/career/roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid }),
        });
        const data = await res.json();
        setRoadmapData(data);
      } catch (err) {
        console.error('Error fetching roadmap:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const defaultRecommendedJobs = [
    {
      career_track: 'Kỹ sư giải pháp phần mềm',
      match_score: 92,
      why_it_fits: 'Phù hợp với thế mạnh tư duy phân tích logic và sáng tạo của bạn.',
      skill_tree: { fundamentals: ['Lập trình Python/TypeScript', 'Kiến trúc phần mềm', 'Truy vấn SQL'], core_technologies: ['Điện toán đám mây Cloud', 'DevOps CI/CD'], advanced_skills: ['Thiết kế hệ thống phân tán', 'AI/ML cơ bản'] },
      role_progression: [
        { level: 'Junior', title: 'Software Engineer', description: 'Xây dựng và kiểm thử tính năng cơ bản' },
        { level: 'Mid', title: 'Senior Software Engineer', description: 'Dẫn dắt thiết kế kỹ thuật và mentor' },
        { level: 'Senior', title: 'Tech Lead / Architect', description: 'Định hướng kiến trúc toàn hệ thống' },
      ]
    },
    {
      career_track: 'Quản lý Sản phẩm (Product Manager)',
      match_score: 86,
      why_it_fits: 'Tương thích cao với kỹ năng giải quyết vấn đề và định hướng thị trường.',
      skill_tree: { fundamentals: ['Quản lý dự án Agile/Scrum', 'Phân tích yêu cầu'], core_technologies: ['Thiết kế UX/UI', 'SQL & Data Analysis'], advanced_skills: ['Tư duy chiến lược sản phẩm', 'OKR & Roadmapping'] },
      role_progression: [
        { level: 'Junior', title: 'Associate PM', description: 'Hỗ trợ PM triển khai tính năng' },
        { level: 'Mid', title: 'Product Manager', description: 'Quản lý toàn bộ vòng đời sản phẩm' },
        { level: 'Senior', title: 'Head of Product', description: 'Định hướng chiến lược sản phẩm toàn công ty' },
      ]
    },
    {
      career_track: 'Nhà thiết kế UX/UI',
      match_score: 78,
      why_it_fits: 'Phù hợp với khả năng tư duy sáng tạo và thấu hiểu người dùng.',
      skill_tree: { fundamentals: ['Figma / Adobe XD', 'Design Thinking', 'Wireframing'], core_technologies: ['Prototyping', 'User Research', 'Usability Testing'], advanced_skills: ['Design System', 'Motion Design', 'Accessibility'] },
      role_progression: [
        { level: 'Junior', title: 'UI Designer', description: 'Thiết kế giao diện theo design system' },
        { level: 'Mid', title: 'UX/UI Designer', description: 'Nghiên cứu người dùng và thiết kế trải nghiệm' },
        { level: 'Senior', title: 'Lead Designer / Head of Design', description: 'Xây dựng design system và định hướng thương hiệu' },
      ]
    },
  ];

  const paths = roadmapData?.paths?.length > 0 ? roadmapData.paths : defaultRecommendedJobs;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '64px 48px', fontFamily: '"Google Sans Flex", sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '24px' }}>
          Lộ trình Sự nghiệp Đề xuất của Bạn
        </h2>

        {isLoading ? (
          <div className="gemini-card" style={{ borderRadius: '20px', padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} color="#0260FF" />
            <h3 style={{ fontWeight: 500, fontSize: '20px', color: '#06040E' }}>Đang tổng hợp lộ trình từ AI & cơ sở dữ liệu...</h3>
            <p style={{ color: '#5F6368', fontSize: '16px' }}>Vui lòng đợi trong giây lát.</p>
          </div>
        ) : (
          <>
            {roadmapData?.user_profile_summary && (
              <div className="gemini-card" style={{ borderRadius: '20px', padding: '24px 32px', marginBottom: '32px', background: '#F0F4FF', border: '1px solid rgba(2,96,255,0.1)' }}>
                <h4 style={{ fontWeight: 500, fontSize: '18px', color: '#0260FF', marginBottom: '8px' }}>Tổng quan Hồ sơ Năng lực</h4>
                <p style={{ fontSize: '16px', lineHeight: '24px', color: '#06040E' }}>{roadmapData.user_profile_summary}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Competency Summary */}
              <div className="gemini-card" style={{ borderRadius: '20px', padding: '32px' }}>
                <h3 className="gemini-gradient-text" style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24px', marginBottom: '24px' }}>Năng lực Cốt lõi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    // Lấy trait_scores từ AI, fallback về mặc định
                    const traitMap: Record<string, string> = {
                      logical_thinking: 'Tư duy Logic',
                      creativity: 'Sáng tạo',
                      adaptability: 'Thích ứng',
                      communication: 'Giao tiếp',
                      teamwork: 'Làm việc nhóm',
                      leadership: 'Lãnh đạo',
                      technical_skill: 'Kỹ năng kỹ thuật',
                      problem_solving: 'Giải quyết vấn đề',
                      emotional_intelligence: 'Trí tuệ cảm xúc',
                      market_awareness: 'Nhận thức thị trường',
                    };
                    const rawScores: Record<string, number> = roadmapData?.trait_scores ||
                      roadmapData?.profile?.trait_scores || {};
                    const scoreEntries = Object.entries(rawScores)
                      .filter(([, v]) => typeof v === 'number')
                      .map(([k, v]) => ({ n: traitMap[k] || k, v: Math.round(Number(v)) }));
                    const displayScores = scoreEntries.length > 0
                      ? scoreEntries
                      : [
                          { n: 'Tư duy Logic', v: 92 },
                          { n: 'Sáng tạo', v: 84 },
                          { n: 'Thích ứng', v: 88 },
                          { n: 'Giao tiếp', v: 76 },
                          { n: 'Làm việc nhóm', v: 80 },
                          { n: 'Lãnh đạo', v: 70 },
                          { n: 'Kỹ năng kỹ thuật', v: 85 },
                          { n: 'Giải quyết vấn đề', v: 90 },
                          { n: 'Trí tuệ cảm xúc', v: 72 },
                          { n: 'Nhận thức thị trường', v: 68 },
                        ];
                    return displayScores.map(s => (
                      <div key={s.n}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#06040E', fontWeight: 400, fontSize: '14px' }}>
                          <span>{s.n}</span> <span style={{ color: '#0260FF', fontWeight: 500 }}>{s.v}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: '#F0F4FF' }}>
                          <div style={{ height: '6px', borderRadius: '3px', background: 'linear-gradient(53deg, #0260FF, #40A2FF)', width: `${s.v}%`, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Jobs List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {paths.length > 0 ? (
                  paths.map((path: any, i: number) => {
                    const title = path.career_track || 'Ngành nghề';
                    const score = path.match_score || 85;
                    const whyFits = path.why_it_fits;
                    const skillTree = path.skill_tree || {};
                    const allSkills = [
                      ...(skillTree.fundamentals || []),
                      ...(skillTree.core_technologies || []),
                      ...(skillTree.advanced_skills || []),
                    ];

                    return (
                      <div key={i} className="gemini-card" style={{
                        borderRadius: '20px', padding: '32px',
                        display: 'flex', flexDirection: 'column', transition: 'all 0.3s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, paddingRight: '16px' }}>
                            <h4 style={{ fontWeight: 500, fontSize: '24px', lineHeight: '28px', color: '#06040E', marginBottom: '8px' }}>{title}</h4>
                            {whyFits && <p style={{ fontSize: '15px', color: '#5F6368', marginBottom: '16px', lineHeight: '22px' }}>{whyFits}</p>}
                            <button
                              onClick={() => toggleExpand(i)}
                              className="gemini-pill" style={{ height: '40px', padding: '0 20px', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '15px', color: '#06040E', background: expandedIndices.includes(i) ? '#F0F4FF' : '#FFFFFF', cursor: 'pointer', margin: 0, transition: 'all 0.2s' }}>
                              {expandedIndices.includes(i) ? 'Thu gọn' : 'Xem lộ trình kỹ năng chi tiết'}
                            </button>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: '100px' }}>
                            <div className="gemini-gradient-text" style={{ fontWeight: 500, fontSize: '36px', lineHeight: '40px' }}>{score}%</div>
                            <p style={{ fontWeight: 700, fontSize: '12px', color: 'rgba(0,0,0,0.5)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Độ phù hợp</p>
                          </div>
                        </div>

                        {/* Expandable Skills & Progression Section */}
                        {expandedIndices.includes(i) && (
                          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            {allSkills.length > 0 && (
                              <div style={{ marginBottom: '20px' }}>
                                <h5 style={{ fontWeight: 500, fontSize: '16px', color: '#06040E', marginBottom: '12px' }}>Kỹ năng trọng tâm cần trang bị:</h5>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {allSkills.map((skill: string) => (
                                    <span key={skill} style={{ background: '#F8F9FA', padding: '8px 16px', borderRadius: '16px', fontSize: '14px', color: '#0260FF', border: '1px solid rgba(2,96,255,0.1)' }}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {path.role_progression && path.role_progression.length > 0 && (
                              <div>
                                <h5 style={{ fontWeight: 500, fontSize: '16px', color: '#06040E', marginBottom: '12px' }}>Lộ trình thăng tiến vị trí:</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {path.role_progression.map((step: any, idx: number) => (
                                    <div key={idx} style={{ background: '#FAFBFD', padding: '12px 16px', borderRadius: '12px', borderLeft: '3px solid #0260FF' }}>
                                      <div style={{ fontWeight: 500, fontSize: '15px', color: '#06040E' }}>
                                        <span style={{ color: '#0260FF', marginRight: '8px' }}>[{step.level || 'Cấp độ'}]</span>
                                        {step.title}
                                      </div>
                                      {step.description && <div style={{ fontSize: '13px', color: '#5F6368', marginTop: '4px' }}>{step.description}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : null}
              </div>
            </div>
          </>
        )}

        <button className="gemini-pill" onClick={() => onNavigate('home')} style={{ marginTop: '48px', height: '56px', padding: '0 32px', borderRadius: '28px', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 500, fontSize: '16px', color: '#06040E', background: '#FFFFFF', cursor: 'pointer' }}>Trở về Trang chủ</button>
      </div>
    </div>
  );
}

export default ResultsView;
