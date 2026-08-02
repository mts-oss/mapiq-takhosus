import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  GraduationCap, 
  Search, 
  Star, 
  BookOpen, 
  Layers, 
  ClipboardList 
} from 'lucide-react';

export default function Reports() {
  const { classes, teachers, fetchRecapReport, fetchJournalsReport } = useAppState();

  // Tab State
  const [reportTab, setReportTab] = useState('presensi'); // presensi | jurnal

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Local report states fetched from API
  const [recapDataRaw, setRecapDataRaw] = useState([]);
  const [journalLogsRaw, setJournalLogsRaw] = useState([]);

  // Initialize selected class when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  // Fetch report logs from API on filter changes
  useEffect(() => {
    if (!selectedClass || !startDate || !endDate) return;

    const loadReports = async () => {
      const recap = await fetchRecapReport(selectedClass, startDate, endDate);
      const journals = await fetchJournalsReport(selectedClass, startDate, endDate);
      setRecapDataRaw(recap);
      setJournalLogsRaw(journals);
    };

    loadReports();
  }, [selectedClass, startDate, endDate, fetchRecapReport, fetchJournalsReport]);

  // Class Info
  const activeClassObj = useMemo(() => {
    return classes.find(c => c.id === selectedClass);
  }, [classes, selectedClass]);

  const activeClassName = activeClassObj ? activeClassObj.name : 'Semua Kelas';

  // 1. Calculate Student Attendance & Star Recap within date range
  const recapData = useMemo(() => {
    return recapDataRaw.filter(row => 
      row.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recapDataRaw, searchTerm]);

  // 2. Filter Teacher Journals within date range
  const journalLogs = journalLogsRaw;

  // --- EXPORT TO EXCEL ---
  const exportToExcel = () => {
    if (reportTab === 'presensi') {
      const exportRows = recapData.map(row => ({
        'ID / NIS': row.studentId,
        'Nama Siswa': row.studentName,
        'Hadir (H)': row.hadir,
        'Sakit (S)': row.sakit,
        'Izin (I)': row.izin,
        'Alpa (A)': row.alpa,
        'Total Bintang': row.stars,
        'Nilai Keaktifan': row.stars * 100
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      
      // Auto width
      ws['!cols'] = [
        { wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');
      XLSX.writeFile(wb, `Rekap_Presensi_${activeClassName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.xlsx`);
    } else {
      // Export Journal
      const exportRows = journalLogs.map(log => {
        const teacher = teachers.find(t => t.id === log.teacherId);
        return {
          'Tanggal': log.date,
          'Guru / Ustadz': teacher ? teacher.name : 'Tidak Diketahui',
          'Materi Pembelajaran': log.subjectTopic,
          'Uraian Kegiatan & Evaluasi': log.journalSummary
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      ws['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 55 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Pengajaran');
      XLSX.writeFile(wb, `Jurnal_Mengajar_${activeClassName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.xlsx`);
    }
  };

  // --- EXPORT TO PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header Logo & text styling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 81, 50); // Emerald color
    doc.text('MA PIQ SINGOSARI MALANG', 105, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('PROGRAM TAKHOSUS (TAHFIDZ & KITAB KUNING)', 105, 21, { align: 'center' });
    
    doc.setDrawColor(15, 81, 50);
    doc.setLineWidth(0.8);
    doc.line(14, 25, 196, 25); // horizontal header line

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    
    if (reportTab === 'presensi') {
      doc.setFont('Helvetica', 'bold');
      doc.text('LAPORAN REKAPITULASI PRESENSI & KEAKTIFAN SISWA', 14, 33);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Kelas: ${activeClassName}`, 14, 39);
      doc.text(`Periode Laporan: ${startDate} s.d. ${endDate}`, 14, 44);
      doc.text(`Jumlah Pertemuan: ${recapData[0]?.meetingsCount || 0} Pertemuan`, 14, 49);

      const tableColumn = ["NIS", "Nama Siswa", "H", "S", "I", "A", "Bintang", "Nilai"];
      const tableRows = recapData.map(row => [
        row.studentId,
        row.studentName,
        row.hadir,
        row.sakit,
        row.izin,
        row.alpa,
        row.stars,
        row.stars * 100
      ]);

      doc.autoTable({
        startY: 55,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 81, 50], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 65 },
          2: { halign: 'center', cellWidth: 12 },
          3: { halign: 'center', cellWidth: 12 },
          4: { halign: 'center', cellWidth: 12 },
          5: { halign: 'center', cellWidth: 12 },
          6: { halign: 'center', cellWidth: 20 },
          7: { halign: 'center', cellWidth: 20 }
        }
      });
      
      doc.save(`Rekap_Presensi_${activeClassName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.pdf`);
    } else {
      // Export PDF Journal
      doc.setFont('Helvetica', 'bold');
      doc.text('JURNAL PENGAJARAN HARIAN GURU', 14, 33);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Kelas: ${activeClassName}`, 14, 39);
      doc.text(`Periode Jurnal: ${startDate} s.d. ${endDate}`, 14, 44);

      const tableColumn = ["Tanggal", "Pengajar", "Materi Pembelajaran", "Uraian & Evaluasi Kegiatan"];
      const tableRows = journalLogs.map(log => {
        const teacher = teachers.find(t => t.id === log.teacherId);
        return [
          log.date,
          teacher ? teacher.name : 'Tidak Diketahui',
          log.subjectTopic,
          log.journalSummary
        ];
      });

      doc.autoTable({
        startY: 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 81, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 50 },
          3: { cellWidth: 67 }
        }
      });

      doc.save(`Jurnal_Mengajar_${activeClassName.replace(/\s+/g, '_')}_${startDate}_sd_${endDate}.pdf`);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h2 className="page-title">Rekapan & Laporan</h2>
          <p className="page-subtitle">Pilih filter dan rentang tanggal untuk mencetak serta mendownload laporan</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={exportToExcel} className="btn btn-secondary">
            <FileSpreadsheet size={16} />
            Ekspor Excel
          </button>
          <button onClick={exportToPDF} className="btn btn-outline" style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            <FileText size={16} />
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-bar">
        <div className="filter-row">
          <div className="form-group">
            <label className="form-label">
              <GraduationCap size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Pilih Kelas
            </label>
            <select 
              className="form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Tanggal Mulai
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Tanggal Akhir
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <button 
          className={`btn ${reportTab === 'presensi' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setReportTab('presensi'); setSearchTerm(''); }}
        >
          <ClipboardList size={16} />
          Rekap Presensi Siswa
        </button>
        <button 
          className={`btn ${reportTab === 'jurnal' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setReportTab('jurnal'); setSearchTerm(''); }}
        >
          <BookOpen size={16} />
          Log Jurnal Mengajar
        </button>
      </div>

      {/* Main Reports Display */}
      <div className="card">
        {/* If Student tab, show search bar */}
        {reportTab === 'presensi' && (
          <div className="card-header" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'block' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '40px' }} 
                placeholder="Cari nama siswa atau NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            
            {/* Presensi Tab Content */}
            {reportTab === 'presensi' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NIS</th>
                    <th>Nama Siswa</th>
                    <th style={{ textAlign: 'center' }}>Hadir (H)</th>
                    <th style={{ textAlign: 'center' }}>Sakit (S)</th>
                    <th style={{ textAlign: 'center' }}>Izin (I)</th>
                    <th style={{ textAlign: 'center' }}>Alpa (A)</th>
                    <th style={{ textAlign: 'center' }}>Bintang</th>
                    <th style={{ textAlign: 'center' }}>Skor Keaktifan</th>
                  </tr>
                </thead>
                <tbody>
                  {recapData.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data rekap presensi.</td>
                    </tr>
                  ) : (
                    recapData.map((row) => (
                      <tr key={row.studentId}>
                        <td style={{ fontWeight: 600 }}>{row.studentId}</td>
                        <td style={{ fontWeight: 500 }}>{row.studentName}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-hadir)' }}>{row.hadir}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-sakit)' }}>{row.sakit}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-izin)' }}>{row.izin}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-alpa)' }}>
                          <span style={{ 
                            backgroundColor: row.alpa > 0 ? 'var(--danger-light)' : 'transparent',
                            color: row.alpa > 0 ? 'var(--danger)' : 'var(--text-muted)',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {row.alpa}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--secondary-hover)' }}>
                            <Star size={14} style={{ fill: row.stars > 0 ? 'var(--secondary)' : 'none' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.stars}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '13px'
                          }}>
                            {row.stars * 100}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Jurnal Tab Content */}
            {reportTab === 'jurnal' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Tanggal</th>
                    <th style={{ width: '180px' }}>Ustadz / Guru</th>
                    <th style={{ width: '220px' }}>Materi Pelajaran</th>
                    <th>Ringkasan Jurnal & Evaluasi</th>
                  </tr>
                </thead>
                <tbody>
                  {journalLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data jurnal dalam rentang tanggal ini.</td>
                    </tr>
                  ) : (
                    journalLogs.map((log, idx) => {
                      const teacher = teachers.find(t => t.id === log.teacherId);
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{log.date}</td>
                          <td style={{ fontWeight: 500, color: 'var(--primary)' }}>
                            {teacher ? teacher.name : 'Tidak Diketahui'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.subjectTopic}</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                            {log.journalSummary}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
