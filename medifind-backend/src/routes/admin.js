const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin'); // Import the role-check middleware

// All routes here require the user to be logged in AND have ADMIN role
router.get('/pending', authenticateToken, isAdmin, adminController.getPendingPharmacies);
router.post('/approve/:id', authenticateToken, isAdmin, adminController.approvePharmacy);
// Add this under your /approve route
router.post('/reject/:id', authenticateToken, isAdmin, adminController.rejectPharmacy);

router.get('/audit-logs', authenticateToken, isAdmin, adminController.getAuditLogs);
router.get('/customers', authenticateToken, isAdmin, adminController.getRecentCustomers);
router.get('/pharmacies', authenticateToken, isAdmin, adminController.getRecentPharmacies);

module.exports = router;