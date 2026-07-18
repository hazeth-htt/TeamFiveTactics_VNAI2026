import React, { useState, useEffect } from 'react';
import { View } from '../types';
import CustomSelect from '../components/CustomSelect';

function MarketView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [region, setRegion] = useState('Toàn quốc');
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '64px 48px', fontFamily: '"Google Sans Flex", sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Section 1: Trending Industries */}
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '32px' }}>
            Top Lĩnh vực thịnh hành
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>

            {/* Industry 1 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', transition: 'all .25s ease', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #0260FF 0%, #00C6FF 100%)', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF' }}>Công nghệ Thông tin</h3>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {['Trí tuệ Nhân tạo (AI)', 'Kỹ sư Dữ liệu', 'An toàn Thông tin'].map((job, idx) => (
                    <div key={job} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7', transition: 'all .2s ease' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: '20px', color: '#2563EB' }}>{idx + 1}</div>
                      <div style={{ fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{job}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Industry 2 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', transition: 'all .25s ease', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #0260FF 0%, #00C6FF 100%)', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF' }}>Marketing & Kinh doanh</h3>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {['Digital Marketing', 'Phân tích Kinh doanh', 'Quản trị Sản phẩm'].map((job, idx) => (
                    <div key={job} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7', transition: 'all .2s ease' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: '20px', color: '#2563EB' }}>{idx + 1}</div>
                      <div style={{ fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{job}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Industry 3 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', transition: 'all .25s ease', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #0260FF 0%, #00C6FF 100%)', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF' }}>Y tế & Chăm sóc</h3>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {['Dược lý học', 'Điều dưỡng', 'Công nghệ sinh học'].map((job, idx) => (
                    <div key={job} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7', transition: 'all .2s ease' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: '20px', color: '#2563EB' }}>{idx + 1}</div>
                      <div style={{ fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{job}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Regional Trends */}
        <section className="gemini-card" style={{ marginBottom: '64px', borderRadius: '20px', padding: '48px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Column 1: Rising */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Đang tăng trưởng (Tuyển dụng cao)
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                  </h3>
                </div>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {[
                    { n: 'Kỹ sư Phần mềm', field: 'Công nghệ Thông tin' },
                    { n: 'Chuyên viên SEO', field: 'Marketing' },
                    { n: 'Phân tích Dữ liệu', field: 'Dữ liệu & Kinh doanh' }
                  ].map(j => (
                    <div key={j.n} style={{ padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all .2s ease' }}>
                      <span style={{ fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{j.n}</span>
                      <span style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600, padding: '6px 10px', background: '#F3F4F6', color: '#6B7280', borderRadius: '999px', border: 'none', letterSpacing: 0 }}>{j.field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Falling */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #D93025 0%, #FF4B2B 100%)', padding: '20px 24px' }}>
                  <h3 style={{ fontWeight: 500, fontSize: '20px', lineHeight: '24px', margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Tuyển dụng ít (Cạnh tranh khốc liệt)
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
                  </h3>
                </div>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {[
                    { n: 'Nhân viên Bưu chính', field: 'Vận tải & Logistics' },
                    { n: 'Kế toán sơ cấp', field: 'Tài chính' },
                    { n: 'Quản lý kho thủ công', field: 'Sản xuất' }
                  ].map(j => (
                    <div key={j.n} style={{ padding: '14px 18px', borderRadius: '14px', border: '1px solid #EEF2F7', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all .2s ease' }}>
                      <span style={{ fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E' }}>{j.n}</span>
                      <span style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 600, padding: '6px 10px', background: '#F3F4F6', color: '#6B7280', borderRadius: '999px', border: 'none', letterSpacing: 0 }}>{j.field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: CTA */}
        <section style={{ borderRadius: '20px', padding: '64px', textAlign: 'center', background: '#f1f9ffff', boxShadow: '20 24px 80px rgba(0,0,0,0.04)' }}>
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

      </div>
    </div>
  );
}

export default MarketView;
