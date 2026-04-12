const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getUsers, createUser, createBulkUsers, updateUser, deleteUser, resetUserPassword, resetUserPasswordByEmail,
  getSubjects, createSubject, updateSubject, deleteSubject, assignFaculty,
  createDepartment, getDepartments, updateDepartment, deleteDepartment,
  createSection, getSections, updateSection, deleteSection,
  getDashboardStats, promoteStudents
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

// Users
router.post('/users/bulk', createBulkUsers);
router.post('/students/promote', promoteStudents);
router.route('/users').get(getUsers).post(createUser);
router.route('/users/:id').put(updateUser).delete(deleteUser);
router.put('/users/:id/reset-password', resetUserPassword);
router.post('/reset-user-password', resetUserPasswordByEmail);

// Subjects
router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);
router.put('/subjects/:id/assign', assignFaculty);

// Departments
router.route('/departments').get(getDepartments).post(createDepartment);
router.route('/departments/:id').put(updateDepartment).delete(deleteDepartment);

// Sections  
router.route('/sections').get(getSections).post(createSection);
router.route('/sections/:id').put(updateSection).delete(deleteSection);

// Dashboard
router.get('/dashboard', getDashboardStats);

module.exports = router;