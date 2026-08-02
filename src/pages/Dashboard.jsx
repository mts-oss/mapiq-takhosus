import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  Star, 
  AlertTriangle, 
  Trophy,
  Award
} from 'lucide-react';

export default function Dashboard({ setCurrentPage }) {
  const { 
    classes, 
    teachers, 
    students, 
    attendance, 
    getAttentionStudents, 
    getOutstandingStudents 
  } = useAppState();

  const attentionList = getAttentionStudents();
  const outstandingList = getOutstandingStudents();

  // Statistics calculation
  const totalClasses = classes.length;
  const totalTeachers = teachers.length;
  const totalStudents = students.length;
  const totalMeetings = attendance.length;

  // Calculate overall attendance rate
  let overallAttendanceRate = 0;
  if (attendance.length > 0) {
    let totalRecordsCount = 0;
    let totalPresentCount = 0;
    attendance.forEach(att => {
      att.records.forEach(rec => {
        totalRecordsCount++;
        if (rec.status === 'H') {
          totalPresentCount++;
        }
      });
    });
    overallAttendanceRate = totalRecordsCount > 0 ? Math.round((totalPresentCount / totalRecordsCount) * 100) : 0;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">Beranda</h2>
        <p className="page-subtitle">Sistem Presensi, Jurnal & Penilaian Takhosus MA PIQ Singosari</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalClasses}</span>
            <span className="stat-label">Total Kelas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon secondary">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTeachers}</span>
            <span className="stat-label">Total Pengajar</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-label">Total Siswa</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{overallAttendanceRate}%</span>
            <span className="stat-label">Rata-rata Kehadiran</span>
          </div>
        </div>
      </div>

      {/* Vertical Stack for Rankings on Dashboard */}
      <div className="dashboard-vertical-stack">
        
        {/* Perlu Perhatian Khusus */}
        <div className="card">
          <div className="card-header" style={{ borderBottomColor: 'rgba(220, 53, 69, 0.2)', backgroundColor: 'var(--danger-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--danger-text)' }}>
              <AlertTriangle size={20} color="var(--danger)" />
              Perlu Perhatian Khusus (Top 20 Alpa)
            </h3>
            <span className="badge badge-alpa">
              Alpa Terbanyak
            </span>
          </div>
          <div className="card-body">
            {attentionList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0', color: 'var(--text-muted)' }}>
                <Award size={40} strokeWidth={1} style={{ color: 'var(--success)', marginBottom: '10px' }} />
                <p style={{ color: 'var(--success-text)', fontWeight: 600 }}>Alhamdulillah! Semua siswa memiliki tingkat kehadiran yang baik.</p>
              </div>
            ) : (
              <div className="ranking-list">
                {attentionList.map((item, idx) => {
                  const classObj = classes.find(c => c.id === item.student.classId);
                  return (
                    <div key={item.student.id} className="ranking-item" style={{ borderLeft: '4px solid var(--danger)' }}>
                      <div className="ranking-badge-wrapper">
                        <div className="ranking-num" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger-text)' }}>
                          {idx + 1}
                        </div>
                        <div className="ranking-details">
                          <span className="ranking-name">{item.student.name}</span>
                          <span className="ranking-class">{classObj ? classObj.name : 'Kelas Terhapus'}</span>
                        </div>
                      </div>
                      <div className="ranking-score-value alpha-rank">
                        <span>{item.count}x</span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Alpa</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Siswa Berprestasi */}
        <div className="card">
          <div className="card-header" style={{ borderBottomColor: 'rgba(255, 193, 7, 0.2)', backgroundColor: 'var(--secondary-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--warning-text)' }}>
              <Trophy size={20} color="var(--secondary-hover)" style={{ fill: 'var(--secondary)' }} />
              Siswa Berprestasi (Top 20)
            </h3>
            <span className="badge badge-hadir" style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)' }}>
              Bintang + Kehadiran
            </span>
          </div>
          <div className="card-body">
            {outstandingList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0', color: 'var(--text-muted)' }}>
                <Award size={40} strokeWidth={1} style={{ marginBottom: '10px' }} />
                <p>Belum ada data prestasi. Silakan isi presensi & berikan bintang terlebih dahulu.</p>
              </div>
            ) : (
              <div className="ranking-list">
                {outstandingList.map((item, idx) => {
                  const classObj = classes.find(c => c.id === item.student.classId);
                  return (
                    <div key={item.student.id} className="ranking-item">
                      <div className="ranking-badge-wrapper">
                        <div className={`ranking-num ${idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : ''}`}>
                          {idx + 1}
                        </div>
                        <div className="ranking-details">
                          <span className="ranking-name">{item.student.name}</span>
                          <span className="ranking-class">{classObj ? classObj.name : 'Kelas Terhapus'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="ranking-score-value">
                            <Star size={16} />
                            <span>{item.stars}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Hadir: {item.attendanceRate}%
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-xs)',
                          minWidth: '50px',
                          textAlign: 'center'
                        }}>
                          {item.score}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
