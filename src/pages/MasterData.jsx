import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import * as XLSX from 'xlsx';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Search, 
  Edit3, 
  Check, 
  X, 
  AlertCircle 
} from 'lucide-react';

export default function MasterData() {
  const {
    classes,
    teachers,
    students,
    addClass,
    editClass,
    deleteClass,
    addTeacher,
    editTeacher,
    deleteTeacher,
    addStudent,
    addStudentsBatch,
    editStudent,
    deleteStudent
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState('siswa'); // siswa | guru | kelas
  const [searchTerm, setSearchTerm] = useState('');

  // Modals / Form triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // stores { type, data }

  // Form State
  const [studentForm, setStudentForm] = useState({ id: '', name: '', classId: '' });
  const [teacherForm, setTeacherForm] = useState({ id: '', name: '', subject: '' });
  const [classForm, setClassForm] = useState({ id: '', name: '', description: '' });

  // Bulk upload state
  const [previewData, setPreviewData] = useState([]);
  const [uploadError, setUploadError] = useState('');

  // Checkbox selection state for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const handleSelectAllStudents = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteStudents = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedStudentIds.length} siswa yang dicentang?`)) {
      for (const id of selectedStudentIds) {
        await deleteStudent(id);
      }
      setSelectedStudentIds([]);
    }
  };

  // Excel template downloader
  const handleDownloadTemplate = () => {
    const templateRows = [
      { 'ID Siswa': 'S020', 'Nama Siswa': 'Muhammad Luthfi', 'Kelas': 'Kelas 10-A Takhosus' },
      { 'ID Siswa': 'S021', 'Nama Siswa': 'Siti Maisarah', 'Kelas': 'Kelas 10-A Takhosus' },
      { 'ID Siswa': 'S022', 'Nama Siswa': 'Ahmad Zulkarnain', 'Kelas': 'Kelas 11-A Takhosus' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import');
    XLSX.writeFile(wb, 'template_input_siswa_takhosus.xlsx');
  };

  // Excel upload handler
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          setUploadError('File Excel kosong atau format tidak sesuai.');
          return;
        }

        // Validate and normalize keys
        const normalized = rows.map((row, index) => {
          // Look for matching keys case-insensitively
          const idKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === 'idsiswa' || k.toLowerCase() === 'nis' || k.toLowerCase() === 'id');
          const nameKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === 'namasiswa' || k.toLowerCase() === 'nama' || k.toLowerCase().replace(/\s/g, '') === 'namalengkap');
          const classKey = Object.keys(row).find(k => k.toLowerCase() === 'kelas' || k.toLowerCase() === 'class');

          if (!nameKey || !classKey) {
            throw new Error(`Kolom "Nama Siswa" atau "Kelas" tidak ditemukan pada baris ${index + 2}.`);
          }

          return {
            id: row[idKey] ? String(row[idKey]).trim() : `S${Math.floor(1000 + Math.random() * 9000)}`,
            name: String(row[nameKey]).trim(),
            className: String(row[classKey]).trim()
          };
        });

        setPreviewData(normalized);
      } catch (err) {
        setUploadError(err.message || 'Gagal membaca file Excel. Pastikan format benar.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    addStudentsBatch(previewData);
    setPreviewData([]);
    alert(`Berhasil mengimpor ${previewData.length} siswa.`);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (activeSubTab === 'siswa') {
      if (editingItem) {
        editStudent(editingItem.data.id, { name: studentForm.name, classId: studentForm.classId });
      } else {
        addStudent(studentForm);
      }
      setStudentForm({ id: '', name: '', classId: classes[0]?.id || '' });
    } else if (activeSubTab === 'guru') {
      if (editingItem) {
        editTeacher(editingItem.data.id, { name: teacherForm.name, subject: teacherForm.subject });
      } else {
        addTeacher(teacherForm);
      }
      setTeacherForm({ id: '', name: '', subject: '' });
    } else if (activeSubTab === 'kelas') {
      if (editingItem) {
        editClass(editingItem.data.id, { name: classForm.name, description: classForm.description });
      } else {
        addClass(classForm);
      }
      setClassForm({ id: '', name: '', description: '' });
    }
    setShowAddModal(false);
    setEditingItem(null);
  };

  const startEdit = (type, item) => {
    setEditingItem({ type, data: item });
    if (type === 'siswa') {
      setStudentForm({ id: item.id, name: item.name, classId: item.classId });
    } else if (type === 'guru') {
      setTeacherForm({ id: item.id, name: item.name, subject: item.subject });
    } else if (type === 'kelas') {
      setClassForm({ id: item.id, name: item.name, description: item.description });
    }
    setShowAddModal(true);
  };

  const handleCancelForm = () => {
    setShowAddModal(false);
    setEditingItem(null);
    // Reset forms
    setStudentForm({ id: '', name: '', classId: classes[0]?.id || '' });
    setTeacherForm({ id: '', name: '', subject: '' });
    setClassForm({ id: '', name: '', description: '' });
  };

  // Filter lists based on search
  const filteredStudents = students.filter(s => {
    const classObj = classes.find(c => c.id === s.classId);
    const className = classObj ? classObj.name : '';
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           className.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
        <div>
          <h2 className="page-title">Kelola Data</h2>
          <p className="page-subtitle">Manajemen master data siswa, pengajar ustadz/ustadzah, dan data kelas</p>
        </div>
        <button 
          onClick={() => {
            // Set default classId for student form if classes exist
            if (classes.length > 0 && !studentForm.classId) {
              setStudentForm(prev => ({ ...prev, classId: classes[0].id }));
            }
            setShowAddModal(true);
          }} 
          className="btn btn-primary"
        >
          <Plus size={18} />
          Tambah Manual
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <button 
          className={`btn ${activeSubTab === 'siswa' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveSubTab('siswa'); setSearchTerm(''); setPreviewData([]); }}
        >
          <Users size={16} />
          Siswa ({students.length})
        </button>
        <button 
          className={`btn ${activeSubTab === 'guru' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveSubTab('guru'); setSearchTerm(''); setPreviewData([]); }}
        >
          <BookOpen size={16} />
          Pengajar ({teachers.length})
        </button>
        <button 
          className={`btn ${activeSubTab === 'kelas' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setActiveSubTab('kelas'); setSearchTerm(''); setPreviewData([]); }}
        >
          <GraduationCap size={16} />
          Kelas ({classes.length})
        </button>
      </div>

      {/* Bulk Upload Excel Section - Only for student sub-tab */}
      {activeSubTab === 'siswa' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Upload size={18} />
              Import Siswa Masal (Excel)
            </h3>
            <button onClick={handleDownloadTemplate} className="btn btn-sm btn-outline" style={{ display: 'flex', gap: '4px' }}>
              <Download size={14} />
              Unduh Template Excel
            </button>
          </div>
          <div className="card-body">
            <div className="upload-zone">
              <div className="upload-icon">
                <Upload size={32} />
              </div>
              <p style={{ fontWeight: 600 }}>Pilih File Excel Template</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mendukung format .xlsx, .xls</p>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleExcelUpload}
              />
            </div>

            {uploadError && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--danger-text)', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-sm)', marginTop: 'var(--spacing-md)' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '13px' }}>{uploadError}</span>
              </div>
            )}

            {previewData.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>
                  Pratinjau Data Impor ({previewData.length} Siswa)
                </h4>
                <div className="table-responsive" style={{ maxHeight: '200px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID / NIS</th>
                        <th>Nama Siswa</th>
                        <th>Kelas (Akan dibuat otomatis jika tidak ada)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td>{row.id}</td>
                          <td>{row.name}</td>
                          <td>{row.className}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 5 && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    * Menampilkan 5 baris pertama dari {previewData.length} total baris.
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPreviewData([])} className="btn btn-sm btn-outline">
                    <X size={14} /> Batalkan
                  </button>
                  <button onClick={handleConfirmImport} className="btn btn-sm btn-primary">
                    <Check size={14} /> Simpan ke Data Siswa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Lists Card */}
      <div className="card">
        {/* Search Bar */}
        <div className="card-header" style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'block' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '40px' }} 
              placeholder={`Cari nama, ID, atau kata kunci ${activeSubTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            
            {/* Siswa Table */}
            {activeSubTab === 'siswa' && (
              <>
                {selectedStudentIds.length > 0 && (
                  <div style={{ padding: '10px 16px', backgroundColor: 'var(--danger-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger-text)' }}>
                      {selectedStudentIds.length} Siswa Dicentang / Terpilih
                    </span>
                    <button onClick={handleBulkDeleteStudents} className="btn btn-sm btn-danger">
                      <Trash2 size={14} /> Hapus {selectedStudentIds.length} Siswa Terpilih
                    </button>
                  </div>
                )}
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                          onChange={handleSelectAllStudents}
                          title="Centang Semua Siswa"
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </th>
                      <th>ID Siswa</th>
                      <th>Nama Lengkap</th>
                      <th>Kelas</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data siswa ditemukan.</td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const classObj = classes.find(c => c.id === student.classId);
                        const isChecked = selectedStudentIds.includes(student.id);
                        return (
                          <tr key={student.id} style={{ backgroundColor: isChecked ? 'rgba(15, 81, 50, 0.05)' : 'transparent' }}>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => handleSelectStudent(student.id)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                              />
                            </td>
                            <td style={{ fontWeight: 600 }}>{student.id}</td>
                            <td>{student.name}</td>
                            <td>
                              <span className="badge badge-hadir" style={{ textTransform: 'none' }}>
                                {classObj ? classObj.name : 'Kelas Terhapus'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button onClick={() => startEdit('siswa', student)} className="btn btn-icon btn-sm btn-outline" title="Edit">
                                  <Edit3 size={14} />
                                </button>
                                <button onClick={() => { if(confirm(`Hapus siswa ${student.name}?`)) deleteStudent(student.id); }} className="btn btn-icon btn-sm btn-danger" title="Hapus">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </>
            )}

            {/* Pengajar Table */}
            {activeSubTab === 'guru' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Pengajar</th>
                    <th>Nama Ustadz / Ustadzah</th>
                    <th>Materi / Mata Pelajaran</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data pengajar ditemukan.</td>
                    </tr>
                  ) : (
                    filteredTeachers.map(teacher => (
                      <tr key={teacher.id}>
                        <td style={{ fontWeight: 600 }}>{teacher.id}</td>
                        <td>{teacher.name}</td>
                        <td>{teacher.subject}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button onClick={() => startEdit('guru', teacher)} className="btn btn-icon btn-sm btn-outline" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => { if(confirm(`Hapus ustadz ${teacher.name}?`)) deleteTeacher(teacher.id); }} className="btn btn-icon btn-sm btn-danger" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Kelas Table */}
            {activeSubTab === 'kelas' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Kelas</th>
                    <th>Nama Kelas</th>
                    <th>Deskripsi Kelas</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data kelas ditemukan.</td>
                    </tr>
                  ) : (
                    filteredClasses.map(cls => (
                      <tr key={cls.id}>
                        <td style={{ fontWeight: 600 }}>{cls.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{cls.name}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{cls.description}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button onClick={() => startEdit('kelas', cls)} className="btn btn-icon btn-sm btn-outline" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => { if(confirm(`Hapus kelas ${cls.name}? Menghapus kelas akan menghapus semua siswa di kelas ini.`)) deleteClass(cls.id); }} className="btn btn-icon btn-sm btn-danger" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingItem ? 'Edit Data' : 'Tambah Data'} {activeSubTab.toUpperCase()}
              </h3>
              <button className="modal-close-btn" onClick={handleCancelForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                
                {/* Form fields for Siswa */}
                {activeSubTab === 'siswa' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">ID Siswa / NIS</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        disabled={!!editingItem} 
                        value={studentForm.id}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, id: e.target.value }))}
                        placeholder="Contoh: S023"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nama Siswa</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={studentForm.name}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Masukkan nama lengkap siswa"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pilih Kelas</label>
                      <select 
                        className="form-select" 
                        required
                        value={studentForm.classId}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, classId: e.target.value }))}
                      >
                        <option value="" disabled>-- Pilih Kelas --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Form fields for Guru */}
                {activeSubTab === 'guru' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">ID Pengajar</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        disabled={!!editingItem}
                        value={teacherForm.id}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, id: e.target.value }))}
                        placeholder="Contoh: G005"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nama Ustadz / Ustadzah</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={teacherForm.name}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Masukkan nama pengajar beserta gelar"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Materi / Pelajaran Utama</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={teacherForm.subject}
                        onChange={(e) => setTeacherForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Contoh: Tahfidz, Tafsir, Shorof, dll."
                      />
                    </div>
                  </>
                )}

                {/* Form fields for Kelas */}
                {activeSubTab === 'kelas' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">ID Kelas</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        disabled={!!editingItem}
                        value={classForm.id}
                        onChange={(e) => setClassForm(prev => ({ ...prev, id: e.target.value }))}
                        placeholder="Contoh: K004"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nama Kelas</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={classForm.name}
                        onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Kelas 10-B Takhosus"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Deskripsi / Detail Kelas</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={classForm.description}
                        onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Keterangan program kelas..."
                      />
                    </div>
                  </>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" onClick={handleCancelForm} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
