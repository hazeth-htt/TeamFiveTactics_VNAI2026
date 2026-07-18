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

function ProfileView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [region, setRegion] = useState('Toàn quốc');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [noInterest, setNoInterest] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('careerPilotProfile');
    if (saved) {
      setIsEditing(false);
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
    if (!isEditing) return;
    if (noInterest) setNoInterest(false);
    setSelectedFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  };

  const handleNoInterest = () => {
    if (!isEditing) return;
    setNoInterest(true);
    setSelectedFields([]);
  };

  const handleSave = () => {
    if (!isEditing) return;
    localStorage.setItem('careerPilotProfile', JSON.stringify({
      name, birthYear, region, selectedFields, noInterest
    }));
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', fontFamily: '"Google Sans Flex", sans-serif' }}>
      <div className="gemini-card" style={{
        borderRadius: '20px', padding: '48px', maxWidth: '640px', width: '100%',
      }}>
        <h2 style={{ fontWeight: 500, fontSize: '32px', lineHeight: '36px', color: '#06040E', marginBottom: '16px', textAlign: 'center' }}>
          Hồ sơ của bạn
        </h2>
        <p style={{ fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#5F6368', marginBottom: '40px', textAlign: 'center' }}>
          Thông tin này giúp AI cá nhân hóa lộ trình tốt hơn.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Họ và Tên</label>
            <input type="text" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} style={{
              width: '100%', background: '#F5F5F5', borderRadius: '20px', padding: '14px 16px',
              border: '1px solid transparent', outline: 'none', fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E', opacity: isEditing ? 1 : 0.6, cursor: isEditing ? 'text' : 'not-allowed'
            }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Năm sinh</label>
            <input type="number" placeholder="2000" value={birthYear} onChange={e => setBirthYear(e.target.value)} disabled={!isEditing} style={{
              width: '100%', background: '#F5F5F5', borderRadius: '20px', padding: '14px 16px',
              border: '1px solid transparent', outline: 'none', fontWeight: 400, fontSize: '16px', lineHeight: '20px', color: '#06040E', opacity: isEditing ? 1 : 0.6, cursor: isEditing ? 'text' : 'not-allowed'
            }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', marginBottom: '8px' }}>Khu vực</label>
            <CustomSelect
              value={region}
              onChange={setRegion}
              options={['Toàn quốc', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Khác']}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '20px', lineHeight: '24px', color: '#06040E', marginBottom: '16px' }}>Lĩnh vực bạn quan tâm</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {FIELD_GROUPS.map(f => {
              const on = selectedFields.includes(f);
              return (
                <button key={f} onClick={() => toggleField(f)} disabled={!isEditing} style={{
                  padding: '10px 16px', borderRadius: '20px', border: 'none',
                  background: on ? '#0260FF' : '#F5F5F5',
                  color: on ? '#FFFFFF' : '#5F6368', fontWeight: 500, fontSize: '16px', lineHeight: '20px',
                  cursor: isEditing ? 'pointer' : 'not-allowed', transition: 'all 0.2s', opacity: isEditing || on ? 1 : 0.6
                }}>
                  {f}
                </button>
              )
            })}
            <button onClick={handleNoInterest} disabled={!isEditing} style={{
              padding: '10px 16px', borderRadius: '20px', border: 'none',
              background: noInterest ? '#0260FF' : '#F5F5F5',
              color: noInterest ? '#FFFFFF' : '#5F6368', fontWeight: 500, fontSize: '16px', lineHeight: '20px',
              cursor: isEditing ? 'pointer' : 'not-allowed', transition: 'all 0.2s', opacity: isEditing || noInterest ? 1 : 0.6
            }}>
              {noInterest ? '✓ Chưa xác định' : 'Chưa xác định / Không quan tâm'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{
              flex: 1, height: '56px', borderRadius: '28px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer',
              fontWeight: 500, fontSize: '16px', lineHeight: '20px', color: '#06040E', background: isEditing ? '#E8EAED' : 'transparent',
            }}>Chỉnh sửa</button>
            <button className="gemini-gradient-btn" onClick={handleSave} disabled={!isEditing} style={{
              flex: 1, height: '56px', borderRadius: '28px', cursor: isEditing ? 'pointer' : 'not-allowed',
              fontWeight: 500, fontSize: '16px', lineHeight: '20px', opacity: isEditing || isSaved ? 1 : 0.5,
              background: isSaved ? '#34A853' : '' // Green if saved
            }}>
              {isSaved ? '✓ Đã lưu' : 'Lưu thay đổi'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProfileView;
