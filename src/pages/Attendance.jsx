import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Star, CheckCircle, Save, BookOpen, User, Calendar, FileText, Users, MessageSquare } from 'lucide-react';

function AttendanceRow({ student, state, onStatusChange, onStarToggle, onNoteChange }) {
  const [showNote, setShowNote] = useState(!!state.note);

  // Sync internal open state with existing note value if any
  useEffect(() => {
    if (state.note && !showNote) {
      setShowNote(true);
    }
  }, [state.note]);

  return (
    <div className={`attendance-row-card marked-${state.status}`}>
      <div className="attendance-row-content">
        {/* Left side: Student Name, NIS, and Slim Note input */}
        <div className="student-details-col">
          <div className="student-name-main" title={student.name}>{student.name}</div>
          <div className="student-id-sub">NIS: {student.id}</div>
          
          {showNote && (
            <input 
              type="text" 
              className="compact-note-input" 
              placeholder="Tambahkan catatan siswa..."
              value={state.note}
              onChange={(e) => onNoteChange(student.id, e.target.value)}
              autoFocus
            />
          )}
        </div>

        {/* Right side: Controls */}
        <div className="student-actions-col">
          <button 
            type="button" 
            className={`action-icon-btn ${showNote || state.note ? 'active-note' : ''}`}
            onClick={() => setShowNote(!showNote)}
            title="Catatan Pertemuan"
          >
            <MessageSquare size={16} />
          </button>
          
          <button 
            type="button" 
            className={`action-icon-btn star-rating-btn ${state.star ? 'active' : ''}`}
            onClick={() => onStarToggle(student.id)}
            title="Keaktifan (+100)"
          >
            <Star size={16} />
          </button>

          <div className="compact-status-row">
            <button 
              type="button" 
              className={`status-circle btn-h ${state.status === 'H' ? 'active' : ''}`}
              onClick={() => onStatusChange(student.id, 'H')}
            >
              H
            </button>
            <button 
              type="button" 
              className={`status-circle btn-s ${state.status === 'S' ? 'active' : ''}`}
              onClick={() => onStatusChange(student.id, 'S')}
            >
              S
            </button>
            <button 
              type="button" 
              className={`status-circle btn-i ${state.status === 'I' ? 'active' : ''}`}
              onClick={() => onStatusChange(student.id, 'I')}
            >
              I
            </button>
            <button 
              type="button" 
              className={`status-circle btn-a ${state.status === 'A' ? 'active' : ''}`}
              onClick={() => onStatusChange(student.id, 'A')}
            >
              A
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { 
    classes, 
    teachers, 
    students, 
    fetchAttendance, 
    saveAttendance 
  } = useAppState();

  // Selected filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  // Journal fields
  const [subjectTopic, setSubjectTopic] = useState('');
  const [journalSummary, setJournalSummary] = useState('');
  
  // Student records state
  // Format: { [studentId]: { status: 'H'|'S'|'I'|'A', star: boolean, note: string } }
  const [studentRecords, setStudentRecords] = useState({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Initialize selected values
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
    if (teachers.length > 0 && !selectedTeacher) {
      setSelectedTeacher(teachers[0].id);
    }
  }, [classes, teachers]);

  // Load existing records if any
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    let isSubscribed = true;

    const loadData = async () => {
      const existingRecord = await fetchAttendance(selectedDate, selectedClass);
      
      if (!isSubscribed) return;

      const classStudents = students.filter((s) => s.classId === selectedClass);
      
      if (existingRecord) {
        // Pre-fill from existing record
        setSelectedTeacher(existingRecord.teacherId || (teachers[0]?.id || ''));
        setSubjectTopic(existingRecord.subjectTopic || '');
        setJournalSummary(existingRecord.journalSummary || '');

        const recordsMap = {};
        classStudents.forEach((student) => {
          const studentRec = existingRecord.records.find((r) => r.studentId === student.id);
          recordsMap[student.id] = {
            status: studentRec ? studentRec.status : 'H',
            star: studentRec ? !!studentRec.star : false,
            note: studentRec ? studentRec.note : ''
          };
        });
        setStudentRecords(recordsMap);
      } else {
        // Create fresh default records
        setSubjectTopic('');
        setJournalSummary('');
        
        const recordsMap = {};
        classStudents.forEach((student) => {
          recordsMap[student.id] = {
            status: 'H',
            star: false,
            note: ''
          };
        });
        setStudentRecords(recordsMap);
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedClass, selectedDate, students, fetchAttendance]);

  // Handle status change
  const setStudentStatus = (studentId, status) => {
    setStudentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  // Handle star toggle
  const toggleStar = (studentId) => {
    setStudentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        star: !prev[studentId]?.star
      }
    }));
  };

  // Handle student note change
  const setStudentNote = (studentId, note) => {
    setStudentRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  // Handle Mark All Status (e.g., set all to Hadir)
  const handleMarkAllStatus = (status) => {
    const classStudents = students.filter((s) => s.classId === selectedClass);
    setStudentRecords((prev) => {
      const updated = { ...prev };
      classStudents.forEach((student) => {
        updated[student.id] = {
          ...updated[student.id],
          status
        };
      });
      return updated;
    });
  };

  // Save changes
  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedTeacher) {
      alert('Harap pilih Kelas dan Pengajar.');
      return;
    }

    const classStudents = students.filter((s) => s.classId === selectedClass);
    const recordsArray = classStudents.map((student) => {
      const state = studentRecords[student.id] || { status: 'H', star: false, note: '' };
      return {
        studentId: student.id,
        status: state.status,
        star: state.star,
        note: state.note
      };
    });

    const fullRecord = {
      date: selectedDate,
      classId: selectedClass,
      teacherId: selectedTeacher,
      subjectTopic,
      journalSummary,
      records: recordsArray
    };

    saveAttendance(fullRecord);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const filteredStudents = students
    .filter((s) => s.classId === selectedClass)
    .sort((a, b) => {
      const idA = String(a.id || a._id || '');
      const idB = String(b.id || b._id || '');
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title">Presensi & Jurnal</h2>
        <p className="page-subtitle">Pencatatan kehadiran harian siswa, keaktifan (bintang), dan jurnal pengajaran</p>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'var(--primary)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn var(--transition-fast)'
        }}>
          <CheckCircle size={20} />
          <span>Data presensi dan jurnal berhasil disimpan!</span>
        </div>
      )}

      {/* Filter and Settings Form */}
      <form onSubmit={handleSave}>
        <div className="filter-bar">
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Tanggal Pertemuan
              </label>
              <input 
                type="date" 
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Pilih Kelas
              </label>
              <select 
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Ustadz / Pengajar
              </label>
              <select 
                className="form-select"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Student Attendance List */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="card-title">
              <Users size={18} />
              Daftar Siswa ({filteredStudents.length} orang)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => handleMarkAllStatus('H')} 
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'var(--success)', color: 'var(--success-text)', fontSize: '12px', fontWeight: 600 }}
              >
                <CheckCircle size={14} /> Centang Semua Hadir (H)
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', color: 'var(--text-muted)' }}>
                <p>Belum ada data siswa di kelas ini.</p>
                <p style={{ fontSize: '12px' }}>Silakan tambahkan siswa di menu Kelola Data.</p>
              </div>
            ) : (
              <div className="mobile-attendance-list">
                {filteredStudents.map((student) => {
                  const state = studentRecords[student.id] || { status: 'H', star: false, note: '' };
                  
                  return (
                    <AttendanceRow
                      key={student.id}
                      student={student}
                      state={state}
                      onStatusChange={setStudentStatus}
                      onStarToggle={toggleStar}
                      onNoteChange={setStudentNote}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Journal Section */}
        <div className="journal-section">
          <h3 className="card-title" style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} />
            Jurnal Pengajaran Guru
          </h3>
          
          <div className="form-group">
            <label className="form-label">Materi Pembelajaran</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Kitab Fathul Qorib Bab Sholat, Juz Amma, dll."
              value={subjectTopic}
              onChange={(e) => setSubjectTopic(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Uraian Kegiatan / Evaluasi Kelas</label>
            <textarea 
              rows={3} 
              className="form-textarea" 
              placeholder="Jelaskan ringkasan materi, setoran hafalan terjauh siswa, atau catatan kelas lainnya..."
              value={journalSummary}
              onChange={(e) => setJournalSummary(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'right' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
            <Save size={18} />
            Simpan Presensi & Jurnal
          </button>
        </div>
      </form>
    </div>
  );
}
