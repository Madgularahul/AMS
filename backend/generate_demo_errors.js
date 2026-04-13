const XLSX = require('xlsx');

const data = [
  // Valid users
  { name: "John Doe", email: "john@example.com", password: "Pass@1234", role: "student", department: "Computer Science", departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-001" },
  { name: "Jane Smith", email: "jane@example.com", password: "Pass@1234", role: "student", department: "Computer Science", departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-002" },
  
  // 3 Users with the same email (Errors)
  { name: "Error User 1", email: "duplicate@example.com", password: "Pass@1234", role: "student", department: "Computer Science", departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "ERR-001" },
  { name: "Error User 2", email: "duplicate@example.com", password: "Pass@1234", role: "student", department: "Computer Science", departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "ERR-002" },
  { name: "Error User 3", email: "duplicate@example.com", password: "Pass@1234", role: "student", department: "Computer Science", departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "ERR-003" },

  // Another valid user
  { name: "Alice Brown", email: "alice@example.com", password: "Pass@1234", role: "student", department: "Computer Science", departmentCode: "CSE", section: "A", year: 1, semester: 1, rollNumber: "CSE-1A-003" },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

const fileName = "demo_users_errors.xlsx";
XLSX.writeFile(workbook, fileName);

console.log(`✅ ${fileName} generated with ${data.length} users, including 3 duplicate email entries.`);
