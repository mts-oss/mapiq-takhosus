import React, { createContext, useState, useEffect, useContext } from 'react';

const AppStateContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AppStateProvider = ({ children }) => {
  // Session State
  const [token, setToken] = useState(() => localStorage.getItem('mapiq_token') || '');
  const [user, setUser] = useState(() => {
    const local = localStorage.getItem('mapiq_user');
    return local ? JSON.parse(local) : null;
  });

  // Master Data States
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Analytics States (for Dashboard)
  const [attentionStudents, setAttentionStudents] = useState([]);
  const [outstandingStudents, setOutstandingStudents] = useState([]);
  
  // Loading and error indicators
  const [loading, setLoading] = useState(false);

  // Common Auth Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // 1. Session Login / Logout
  const login = (userData, userToken) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('mapiq_token', userToken);
    localStorage.setItem('mapiq_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setClasses([]);
    setTeachers([]);
    setStudents([]);
    setAttentionStudents([]);
    setOutstandingStudents([]);
    localStorage.removeItem('mapiq_token');
    localStorage.removeItem('mapiq_user');
  };

  // 2. Fetch Master Data
  const fetchClasses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/classes`, { headers: getHeaders() });
      if (res.ok) setClasses(await res.json());
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTeachers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/teachers`, { headers: getHeaders() });
      if (res.ok) setTeachers(await res.json());
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchStudents = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/students`, { headers: getHeaders() });
      if (res.ok) setStudents(await res.json());
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // 3. Fetch Analytics
  const refreshAnalytics = async () => {
    if (!token) return;
    try {
      const [resAttention, resOutstanding] = await Promise.all([
        fetch(`${API_BASE}/analytics/attention`, { headers: getHeaders() }),
        fetch(`${API_BASE}/analytics/outstanding`, { headers: getHeaders() })
      ]);
      if (resAttention.ok) setAttentionStudents(await resAttention.json());
      if (resOutstanding.ok) setOutstandingStudents(await resOutstanding.json());
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Trigger loads on token change (Login event)
  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([
        fetchClasses(),
        fetchTeachers(),
        fetchStudents(),
        refreshAnalytics()
      ]).finally(() => setLoading(false));
    }
  }, [token]);

  // --- ACTIONS (API CRUD CALLS) ---

  // Classes CRUD
  const addClass = async (classObj) => {
    try {
      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(classObj)
      });
      if (res.ok) {
        const newClass = await res.json();
        setClasses((prev) => [...prev, newClass]);
        return newClass;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editClass = async (id, updatedClass) => {
    try {
      const res = await fetch(`${API_BASE}/classes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedClass)
      });
      if (res.ok) {
        const data = await res.json();
        setClasses((prev) => prev.map((c) => (c.id === id ? data : c)));
        // Refresh students and analytics since class deletions/updates might cascade
        fetchStudents();
        refreshAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteClass = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/classes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
        fetchStudents();
        refreshAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Teachers CRUD
  const addTeacher = async (teacher) => {
    try {
      const res = await fetch(`${API_BASE}/teachers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(teacher)
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers((prev) => [...prev, data]);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editTeacher = async (id, updatedTeacher) => {
    try {
      const res = await fetch(`${API_BASE}/teachers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedTeacher)
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers((prev) => prev.map((t) => (t.id === id ? data : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/teachers/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Students CRUD
  const addStudent = async (student) => {
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(student)
      });
      if (res.ok) {
        const data = await res.json();
        setStudents((prev) => [...prev, data]);
        refreshAnalytics();
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addStudentsBatch = async (newStudents) => {
    try {
      const res = await fetch(`${API_BASE}/students/batch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ students: newStudents })
      });
      if (res.ok) {
        await fetchClasses();  // class list might have expanded
        await fetchStudents();
        await refreshAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editStudent = async (id, updatedStudent) => {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedStudent)
      });
      if (res.ok) {
        const data = await res.json();
        setStudents((prev) => prev.map((s) => (s.id === id ? data : s)));
        refreshAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStudent = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        refreshAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Attendance Queries
  const fetchAttendance = async (date, classId) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/attendance?date=${date}&classId=${classId}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data; // Returns the entry or null
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
    return null;
  };

  const saveAttendance = async (record) => {
    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(record)
      });
      if (res.ok) {
        refreshAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reports on-demand queries
  const fetchRecapReport = async (classId, startDate, endDate) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/reports/recap?classId=${classId}&startDate=${startDate}&endDate=${endDate}`, {
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const fetchJournalsReport = async (classId, startDate, endDate) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/reports/journals?classId=${classId}&startDate=${startDate}&endDate=${endDate}`, {
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  return (
    <AppStateContext.Provider
      value={{
        token,
        user,
        classes,
        teachers,
        students,
        loading,
        login,
        logout,
        addClass,
        editClass,
        deleteClass,
        addTeacher,
        editTeacher,
        deleteTeacher,
        addStudent,
        addStudentsBatch,
        editStudent,
        deleteStudent,
        fetchAttendance,
        saveAttendance,
        fetchRecapReport,
        fetchJournalsReport,
        getAttentionStudents: () => attentionStudents,
        getOutstandingStudents: () => outstandingStudents,
        refreshAnalytics
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
