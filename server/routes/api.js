const express = require('express');
const router = express.Router();
const { Class, Teacher, Student, Attendance } = require('../db');
const { verifyToken, requireAdmin } = require('./auth');

// Apply JWT verification to all API routes
router.use(verifyToken);

// ==========================================
// 1. CLASSES ENDPOINTS
// ==========================================

router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find().sort('name');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data kelas.' });
  }
});

router.post('/classes', requireAdmin, async (req, res) => {
  const { id, name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Nama kelas wajib diisi.' });

  try {
    const newClass = await Class.create({ 
      _id: id || `K${Date.now()}`, 
      name, 
      description 
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah kelas. ID mungkin duplikat.' });
  }
});

router.put('/classes/:id', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Nama kelas wajib diisi.' });

  try {
    const updated = await Class.findByIdAndUpdate(
      req.params.id, 
      { name, description },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah data kelas.' });
  }
});

router.delete('/classes/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Class.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
    
    // Cascade delete students and attendance (optional based on your needs)
    await Student.deleteMany({ classId: req.params.id });
    await Attendance.deleteMany({ classId: req.params.id });
    
    res.json({ message: 'Kelas berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data kelas.' });
  }
});


// ==========================================
// 2. TEACHERS ENDPOINTS
// ==========================================

router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort('name');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pengajar.' });
  }
});

router.post('/teachers', requireAdmin, async (req, res) => {
  const { id, name, subject } = req.body;
  if (!name || !subject) return res.status(400).json({ message: 'Nama dan mapel wajib diisi.' });

  try {
    const teacherId = id || `G${Date.now()}`;
    const newTeacher = await Teacher.create({ 
      _id: teacherId, 
      name, 
      subject 
    });

    // Auto-create User login for this teacher
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('guru123', 10);
    const { User } = require('../db');
    await User.create({
      username: teacherId.toLowerCase(),
      passwordHash: defaultPasswordHash,
      role: 'guru',
      teacherId: teacherId
    }).catch(err => console.log('User account already exists or error:', err.message));

    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah pengajar.' });
  }
});

router.put('/teachers/:id', requireAdmin, async (req, res) => {
  const { name, subject } = req.body;
  if (!name || !subject) return res.status(400).json({ message: 'Nama dan mapel wajib diisi.' });

  try {
    const updated = await Teacher.findByIdAndUpdate(
      req.params.id, 
      { name, subject },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Pengajar tidak ditemukan.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah data pengajar.' });
  }
});

router.delete('/teachers/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Teacher.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Pengajar tidak ditemukan.' });
    
    // Also delete user account
    const { User } = require('../db');
    await User.deleteMany({ $or: [{ teacherId: req.params.id }, { username: req.params.id.toLowerCase() }] });

    res.json({ message: 'Pengajar berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data pengajar.' });
  }
});


// ==========================================
// 3. STUDENTS ENDPOINTS
// ==========================================

router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort('_id');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data siswa.' });
  }
});

router.post('/students', requireAdmin, async (req, res) => {
  const { id, name, classId } = req.body;
  if (!name || !classId) return res.status(400).json({ message: 'Nama dan kelas wajib diisi.' });

  try {
    const newStudent = await Student.create({ 
      _id: id || `S${Date.now()}`, 
      name, 
      classId 
    });
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah siswa. ID/NIS mungkin duplikat.' });
  }
});

router.post('/students/batch', requireAdmin, async (req, res) => {
  const { students: rawStudents } = req.body;
  if (!rawStudents || !Array.isArray(rawStudents)) {
    return res.status(400).json({ message: 'Payload tidak valid.' });
  }

  try {
    let importedCount = 0;
    
    // Process one by one to handle dynamic class creation safely
    for (const s of rawStudents) {
      let finalClassId = s.classId;
      
      if (s.className) {
        let existingClass = await Class.findOne({ name: { $regex: new RegExp(`^${s.className.trim()}$`, 'i') } });
        if (existingClass) {
          finalClassId = existingClass._id;
        } else {
          finalClassId = `K${Math.floor(1000 + Math.random() * 9000)}`;
          await Class.create({
            _id: finalClassId,
            name: s.className.trim(),
            description: 'Dibuat otomatis lewat import siswa'
          });
        }
      }

      const studentId = s.id || `S${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Upsert student (ignore if duplicate ID)
      const existingStudent = await Student.findById(studentId);
      if (!existingStudent) {
        await Student.create({ _id: studentId, name: s.name, classId: finalClassId || 'K001' });
        importedCount++;
      }
    }

    res.json({ message: `Berhasil mengimpor ${importedCount} siswa baru.` });
  } catch (error) {
    console.error('Error during batch import:', error);
    res.status(500).json({ message: 'Gagal mengimpor siswa secara masal.' });
  }
});

router.put('/students/:id', requireAdmin, async (req, res) => {
  const { name, classId } = req.body;
  if (!name || !classId) return res.status(400).json({ message: 'Nama dan kelas wajib diisi.' });

  try {
    const updated = await Student.findByIdAndUpdate(
      req.params.id, 
      { name, classId },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah data siswa.' });
  }
});

router.delete('/students/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    res.json({ message: 'Siswa berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data siswa.' });
  }
});


// ==========================================
// 4. ATTENDANCE & JOURNAL ENDPOINTS
// ==========================================

router.get('/attendance', async (req, res) => {
  const { date, classId } = req.query;
  if (!date || !classId) return res.status(400).json({ message: 'Tanggal dan kelas wajib disertakan.' });

  try {
    const log = await Attendance.findOne({ date, classId });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data presensi.' });
  }
});

router.post('/attendance', async (req, res) => {
  const { date, classId, teacherId, subjectTopic, journalSummary, records } = req.body;
  
  if (!date || !classId || !teacherId || !subjectTopic || !journalSummary || !records) {
    return res.status(400).json({ message: 'Payload tidak lengkap.' });
  }

  try {
    // Upsert the attendance log for this date and class
    const saved = await Attendance.findOneAndUpdate(
      { date, classId },
      { 
        teacherId, 
        subjectTopic, 
        journalSummary, 
        records 
      },
      { new: true, upsert: true } // Create if doesn't exist, Update if exists
    );
    
    res.json({ message: 'Presensi dan Jurnal berhasil disimpan.', data: saved });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Gagal menyimpan data presensi.' });
  }
});


// ==========================================
// 5. REPORTS & ANALYTICS ENDPOINTS
// ==========================================

// Recap (Stats mapping computed on server for flexibility)
router.get('/reports/recap', async (req, res) => {
  const { classId, startDate, endDate } = req.query;
  if (!classId || !startDate || !endDate) return res.status(400).json({ message: 'Filter kelas dan rentang tanggal wajib diisi.' });

  try {
    const classStudents = await Student.find({ classId }).sort('_id');
    const logs = await Attendance.find({ 
      classId, 
      date: { $gte: startDate, $lte: endDate } 
    });

    const recap = classStudents.map(student => {
      const stats = {
        studentId: student._id,
        studentName: student.name,
        hadir: 0, sakit: 0, izin: 0, alpa: 0, stars: 0,
        meetingsCount: logs.length
      };

      logs.forEach(log => {
        const record = log.records.find(r => r.studentId === student._id.toString());
        if (record) {
          if (record.status === 'H') stats.hadir++;
          else if (record.status === 'S') stats.sakit++;
          else if (record.status === 'I') stats.izin++;
          else if (record.status === 'A') stats.alpa++;
          
          if (record.star) stats.stars++;
        }
      });

      return stats;
    });

    res.json(recap);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memproses rekapitulasi laporan.' });
  }
});

// Journals (Join with Teacher)
router.get('/reports/journals', async (req, res) => {
  const { classId, startDate, endDate } = req.query;
  if (!classId || !startDate || !endDate) return res.status(400).json({ message: 'Filter kelas dan tanggal wajib diisi.' });

  try {
    const journals = await Attendance.find({ 
      classId, 
      date: { $gte: startDate, $lte: endDate } 
    })
    .populate('teacherId', 'name')
    .sort({ date: -1 });

    const formatted = journals.map(log => ({
      date: log.date,
      teacherName: log.teacherId ? log.teacherId.name : 'Tidak Diketahui',
      subjectTopic: log.subjectTopic,
      journalSummary: log.journalSummary
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat log jurnal pengajaran.' });
  }
});

// Analytics: Top 20 Attention (Mongoose Aggregation Pipeline)
router.get('/analytics/attention', async (req, res) => {
  try {
    const attentionList = await Attendance.aggregate([
      { $unwind: "$records" },
      { $match: { "records.status": "A" } },
      { $group: { _id: "$records.studentId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "studentData" } },
      { $unwind: "$studentData" },
      { $lookup: { from: "classes", localField: "studentData.classId", foreignField: "_id", as: "classData" } },
      { $unwind: "$classData" },
      { 
        $project: { 
          _id: 0, 
          count: 1, 
          student: { 
            id: "$studentData._id", 
            name: "$studentData.name", 
            classId: "$classData.name" 
          } 
        } 
      }
    ]);

    res.json(attentionList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil analisis siswa bermasalah.' });
  }
});

// Analytics: Top 20 Outstanding (Mongoose Aggregation Pipeline)
router.get('/analytics/outstanding', async (req, res) => {
  try {
    const outstandingList = await Attendance.aggregate([
      { $unwind: "$records" },
      { $group: { 
          _id: "$records.studentId", 
          meetings: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$records.status", "H"] }, 1, 0] } },
          stars: { $sum: { $cond: ["$records.star", true, 0] } }
      }},
      { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "studentData" } },
      { $unwind: "$studentData" },
      { $lookup: { from: "classes", localField: "studentData.classId", foreignField: "_id", as: "classData" } },
      { $unwind: "$classData" },
      { $addFields: { 
          attendanceRate: { $multiply: [{ $divide: ["$present", "$meetings"] }, 100] }
      }},
      { $addFields: { 
          score: { $add: [{ $multiply: ["$stars", 100] }, "$attendanceRate"] }
      }},
      { $sort: { score: -1, stars: -1 } },
      { $limit: 20 },
      { 
        $project: { 
          _id: 0, 
          stars: 1, 
          meetings: 1, 
          present: 1, 
          attendanceRate: { $round: ["$attendanceRate", 0] }, 
          score: { $round: ["$score", 0] }, 
          student: { 
            id: "$studentData._id", 
            name: "$studentData.name", 
            classId: "$classData.name" 
          } 
        } 
      }
    ]);

    res.json(outstandingList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil analisis siswa berprestasi.' });
  }
});

module.exports = router;
