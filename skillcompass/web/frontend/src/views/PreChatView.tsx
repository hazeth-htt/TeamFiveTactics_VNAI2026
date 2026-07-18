import React, { useState, useEffect } from 'react';
import { View } from '../types';
import CustomSelect from '../components/CustomSelect';

const FIELD_GROUPS = [
  'Công nghệ Thông tin',
  'Kinh doanh & Quản lý',
  'Marketing & Truyền thông',
  'Thiết kế & Sáng tạo',
  'Kỹ thuật & Sản xuất'
];

function PreChatView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [region, setRegion] = useState('Toàn quốc');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [noInterest, setNoInterest] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('careerPilotProfile');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.birthYear) setBirthYear(data.birthYear);
        if (data.region) setRegion(data.region);
        if (data.selectedFields) setSelectedFields(data.selectedFields);
        if (data.noInterest) setNoInterest(data.noInterest);
      } catch (e) { }
    }
  }, []);

  const toggleField = (f: string) => {
    if (noInterest) setNoInterest(false);
    setSelectedFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  };

  const handleNoInterest = () => {
    setNoInterest(true);
    setSelectedFields([]);
  };

  const handleStart = () => {
    const saved = localStorage.getItem('careerPilotProfile');
    let data = { name, birthYear, region, selectedFields, noInterest };
    if (saved) {
      try {
        data = { ...JSON.parse(saved), ...data };
      } catch (e) { }
    }
    localStorage.setItem('careerPilotProfile', JSON.stringify(data));
    onNavigate('chat');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', fontFamily: '"Google Sans Flex", sans-serif' }}>
      <div className="gemini-card" style={{
        borderRadius: '20px', padding: '48px', maxWidth: '640px', width: '100%',
      }}>
        <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '16px', textAlign: 'center' }}>
          Khảo sát đầu vào
        </h2>
        <p style={{ fontWeight: 400, fontSize: '24px', lineHeight: '28px', color: '#5F6368', marginBottom: '40px', textAlign: 'center' }}>
          Hãy cung cấp một vài thông tin trước khi bắt đầu phiên.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Họ và Tên</label>
            <input type="text" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} style={{
              width: '100%', background: '#F5F5F5', borderRadius: '20px', padding: '14px 16px',
              border: '1px solid transparent', outline: 'none', fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E',
            }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Năm sinh</label>
            <input type="number" placeholder="2000" value={birthYear} onChange={e => setBirthYear(e.target.value)} style={{
              width: '100%', background: '#F5F5F5', borderRadius: '20px', padding: '14px 16px',
              border: '1px solid transparent', outline: 'none', fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E',
            }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Khu vực</label>
            <CustomSelect
              value={region}
              onChange={setRegion}
              options={['Toàn quốc', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Khác']}
            />
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '20px', lineHeight: '24px', color: '#06040E', marginBottom: '16px' }}>Lĩnh vực bạn quan tâm</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {FIELD_GROUPS.map(f => {
              const on = selectedFields.includes(f);
              return (
                <button key={f} onClick={() => toggleField(f)} style={{
                  padding: '10px 16px', borderRadius: '20px', border: 'none',
                  background: on ? '#0260FF' : '#F5F5F5',
                  color: on ? '#FFFFFF' : '#5F6368', fontWeight: 500, fontSize: '16px', lineHeight: '20px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  {f}
                </button>
              )
            })}
            <button onClick={handleNoInterest} style={{
              padding: '10px 16px', borderRadius: '20px', border: 'none',
              background: noInterest ? '#0260FF' : '#F5F5F5',
              color: noInterest ? '#FFFFFF' : '#5F6368', fontWeight: 500, fontSize: '16px', lineHeight: '20px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>
              {noInterest ? '✓ Chưa xác định' : 'Chưa xác định / Không quan tâm'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button onClick={handleStart} className="gemini-gradient-btn" style={{
            width: '100%', height: '56px', borderRadius: '28px', cursor: 'pointer',
            fontWeight: 500, fontSize: '16px', lineHeight: '20px',
          }}>Bắt đầu phiên tư vấn AI</button>
        </div>
      </div>
    </div>
  );
}

export default PreChatView;
