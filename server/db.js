const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'guru'] },
  teacherId: { type: String, default: null } // Optional link to Teacher _id
}, { timestamps: true });

const classSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom String ID e.g., 'K001'
  name: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

const teacherSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom String ID e.g., 'G001'
  name: { type: String, required: true },
  subject: { type: String }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom String ID e.g., 'S001'
  name: { type: String, required: true },
  classId: { type: String, required: true, ref: 'Class' }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true }, // Format YYYY-MM-DD
  classId: { type: String, required: true, ref: 'Class' },
  teacherId: { type: String, required: true, ref: 'Teacher' },
  subjectTopic: { type: String, required: true },
  journalSummary: { type: String, required: true },
  records: [{
    studentId: { type: String, required: true, ref: 'Student' },
    status: { type: String, required: true, enum: ['H', 'S', 'I', 'A'] },
    star: { type: Boolean, default: false },
    note: { type: String, default: '' }
  }]
}, { timestamps: true });

// Ensure unique index for one attendance record per class per day
attendanceSchema.index({ date: 1, classId: 1 }, { unique: true });

// Normalize _id to id in JSON outputs
const transformJSON = (doc, ret) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

userSchema.set('toJSON', { transform: transformJSON });
classSchema.set('toJSON', { transform: transformJSON });
teacherSchema.set('toJSON', { transform: transformJSON });
studentSchema.set('toJSON', { transform: transformJSON });
attendanceSchema.set('toJSON', { transform: transformJSON });

// Create Models
const User = mongoose.model('User', userSchema);
const Class = mongoose.model('Class', classSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Student = mongoose.model('Student', studentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

async function connectDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI environment variable is not defined!");
    console.warn("⚠️ Please set it to your MongoDB Atlas connection string.");
    console.warn("⚠️ For local testing, defaulting to a local memory server or returning error.");
    throw new Error("MONGODB_URI is required to run the server.");
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB Database.");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

let isSeeded = false;

async function initDatabase() {
  await connectDatabase();
  
  if (isSeeded) return;
  
  // Seed Database if Users collection is empty
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('🌱 Database is empty. Seeding initial data...');

    // Seed Classes
    await Class.create([
      { _id: 'K001', name: 'Kelas 10-A Takhosus', description: 'Program Tahfidz & Kitab Kuning Kelas 10' },
      { _id: 'K002', name: 'Kelas 11-A Takhosus', description: 'Program Tahfidz & Kitab Kuning Kelas 11' },
      { _id: 'K003', name: 'Kelas 12-A Takhosus', description: 'Program Tahfidz & Kitab Kuning Kelas 12' }
    ]);

    // Seed Teachers
    await Teacher.create([
      { _id: 'G001', name: 'Ustadz Ahmad Fauzi, Lc.', subject: 'Fikih & Ushul Fikih' },
      { _id: 'G002', name: 'Ustadz M. Ridho, S.Ag.', subject: 'Tahfidz Al-Qur\'an' },
      { _id: 'G003', name: 'Ustadz Yusuf Mansur, M.Pd.I.', subject: 'Tafsir Jalalain' },
      { _id: 'G004', name: 'Ustadzah Khadijah, S.S.', subject: 'Bahasa Arab & Nahwu Shorof' }
    ]);

    // Seed Students
    await Student.create([
      { _id: 'S001', name: 'Muhammad Ali Al-Ghifari', classId: 'K001' },
      { _id: 'S002', name: 'Achmad Zaki Yamani', classId: 'K001' },
      { _id: 'S003', name: 'Fatimah Azzahra', classId: 'K001' },
      { _id: 'S004', name: 'Aisyah Humaira', classId: 'K001' },
      { _id: 'S005', name: 'Abdul Rahman Wahid', classId: 'K001' },
      { _id: 'S006', name: 'Zainuddin Abdillah', classId: 'K001' },
      
      { _id: 'S007', name: 'Habib Rizky Al-Attas', classId: 'K002' },
      { _id: 'S008', name: 'Lukman Hakim', classId: 'K002' },
      { _id: 'S009', name: 'Maryom Hasanah', classId: 'K002' },
      { _id: 'S010', name: 'Farhan Muhammad', classId: 'K002' },
      { _id: 'S011', name: 'Siti Aminah', classId: 'K002' },
      
      { _id: 'S012', name: 'Ahmad Rafiq', classId: 'K003' },
      { _id: 'S013', name: 'Husein Ja\'far', classId: 'K003' },
      { _id: 'S014', name: 'Nayla Shofia', classId: 'K003' },
      { _id: 'S015', name: 'Yusuf Ibrahim', classId: 'K003' },
      { _id: 'S016', name: 'Rahmat Hidayat', classId: 'K003' }
    ]);

    // Hash Default Credentials
    const adminHash = await bcrypt.hash('admin123', 10);
    const guruFauziHash = await bcrypt.hash('guru123', 10);
    const guruRidhoHash = await bcrypt.hash('guru123', 10);

    // Seed Users
    await User.create([
      { username: 'admin', passwordHash: adminHash, role: 'admin', teacherId: null },
      { username: 'ustadzfauzi', passwordHash: guruFauziHash, role: 'guru', teacherId: 'G001' },
      { username: 'ustadzridho', passwordHash: guruRidhoHash, role: 'guru', teacherId: 'G002' }
    ]);

    console.log('✅ Seeding complete.');
  }
  isSeeded = true;
}

module.exports = {
  connectDatabase,
  initDatabase,
  User,
  Class,
  Teacher,
  Student,
  Attendance
};
