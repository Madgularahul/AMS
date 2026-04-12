const XLSX = require('xlsx');

const data = [
  // ── CSE · Year 1 · Sem 1 · Section A ───────────────────────────────────────
  { name: "Aarav Sharma",    email: "aarav.sharma@test.com",    password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-001" },
  { name: "Bhavya Patel",    email: "bhavya.patel@test.com",    password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-002" },
  { name: "Chirag Nair",     email: "chirag.nair@test.com",     password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-003" },
  { name: "Divya Menon",     email: "divya.menon@test.com",     password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-004" },
  { name: "Eshan Verma",     email: "eshan.verma@test.com",     password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-005" },

  // ── CSE · Year 1 · Sem 1 · Section B ───────────────────────────────────────
  { name: "Farida Khan",     email: "farida.khan@test.com",     password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "B", year: 1, semester: 1, rollNumber: "CSE-1B-001" },
  { name: "Gaurav Singh",    email: "gaurav.singh@test.com",    password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "B", year: 1, semester: 1, rollNumber: "CSE-1B-002" },
  { name: "Harini Rao",      email: "harini.rao@test.com",      password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "B", year: 1, semester: 1, rollNumber: "CSE-1B-003" },
  { name: "Ishaan Tiwari",   email: "ishaan.tiwari@test.com",   password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "B", year: 1, semester: 1, rollNumber: "CSE-1B-004" },
  { name: "Jaya Krishnan",   email: "jaya.krishnan@test.com",   password: "Pass@1234", role: "student", department: "Computer Science",        departmentCode: "CSE", section: "B", year: 1, semester: 1, rollNumber: "CSE-1B-005" },

  // ── CSM · Year 2 · Sem 2 · Section A ───────────────────────────────────────
  { name: "Kavya Iyer",      email: "kavya.iyer@test.com",      password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "A", year: 2, semester: 2, rollNumber: "CSM-2A-001" },
  { name: "Lokesh Bansal",   email: "lokesh.bansal@test.com",   password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "A", year: 2, semester: 2, rollNumber: "CSM-2A-002" },
  { name: "Meera Pillai",    email: "meera.pillai@test.com",    password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "A", year: 2, semester: 2, rollNumber: "CSM-2A-003" },
  { name: "Nikhil Das",      email: "nikhil.das@test.com",      password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "A", year: 2, semester: 2, rollNumber: "CSM-2A-004" },
  { name: "Ojaswi Reddy",    email: "ojaswi.reddy@test.com",    password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "A", year: 2, semester: 2, rollNumber: "CSM-2A-005" },

  // ── CSM · Year 2 · Sem 2 · Section B ───────────────────────────────────────
  { name: "Pranav Joshi",    email: "pranav.joshi@test.com",    password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "B", year: 2, semester: 2, rollNumber: "CSM-2B-001" },
  { name: "Qaisra Siddiqui", email: "qaisra.siddiqui@test.com", password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "B", year: 2, semester: 2, rollNumber: "CSM-2B-002" },
  { name: "Rohit Bose",      email: "rohit.bose@test.com",      password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "B", year: 2, semester: 2, rollNumber: "CSM-2B-003" },
  { name: "Sneha Kulkarni",  email: "sneha.kulkarni@test.com",  password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "B", year: 2, semester: 2, rollNumber: "CSM-2B-004" },
  { name: "Tanvi Ghosh",     email: "tanvi.ghosh@test.com",     password: "Pass@1234", role: "student", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "B", year: 2, semester: 2, rollNumber: "CSM-2B-005" },

  // ── CSE Faculty ─────────────────────────────────────────────────────────────
  { name: "Dr. Arjun Mehta",    email: "arjun.mehta@test.com",    password: "Pass@1234", role: "faculty", department: "Computer Science",        departmentCode: "CSE", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Bhoomika Soni",  email: "bhoomika.soni@test.com",  password: "Pass@1234", role: "faculty", department: "Computer Science",        departmentCode: "CSE", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Chetan Dubey",   email: "chetan.dubey@test.com",   password: "Pass@1234", role: "faculty", department: "Computer Science",        departmentCode: "CSE", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Deepa Nambiar",  email: "deepa.nambiar@test.com",  password: "Pass@1234", role: "faculty", department: "Computer Science",        departmentCode: "CSE", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Eknath Pawar",   email: "eknath.pawar@test.com",   password: "Pass@1234", role: "faculty", department: "Computer Science",        departmentCode: "CSE", section: "", year: "", semester: "", rollNumber: "" },

  // ── CSM Faculty ─────────────────────────────────────────────────────────────
  { name: "Dr. Faiz Ansari",    email: "faiz.ansari@test.com",    password: "Pass@1234", role: "faculty", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Gayatri Rajan",  email: "gayatri.rajan@test.com",  password: "Pass@1234", role: "faculty", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Hemant Tewari",  email: "hemant.tewari@test.com",  password: "Pass@1234", role: "faculty", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Indira Varma",   email: "indira.varma@test.com",   password: "Pass@1234", role: "faculty", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "", year: "", semester: "", rollNumber: "" },
  { name: "Dr. Jalaj Shukla",   email: "jalaj.shukla@test.com",   password: "Pass@1234", role: "faculty", department: "Computer Science (AI&ML)", departmentCode: "CSM", section: "", year: "", semester: "", rollNumber: "" },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

XLSX.writeFile(workbook, "test_students.xlsx");
console.log(`✅ test_students.xlsx generated with ${data.length} students across 4 groups.`);
