const prisma = require('../lib/prisma');

const crypto = require('crypto');

// Approve a pharmacy
exports.approvePharmacy = async (req, res) => {
    try {
        const pharmacy = await prisma.pharmacy.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED', rejectionReason: null }
        });
        
        await prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: 'PHARMACY_APPROVED',
                entityType: 'PHARMACY',
                entityId: pharmacy.id,
                performedBy: req.user.id,
                metadata: {
                    adminName: req.user.name,
                    adminEmail: req.user.email,
                    pharmacyName: pharmacy.name
                }
            }
        });

        res.json({ success: true, message: "Pharmacy approved successfully!" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
};

exports.rejectPharmacy = async (req, res) => {
    try {
        const { reason } = req.body;
        const pharmacy = await prisma.pharmacy.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED', rejectionReason: reason || "Did not meet platform guidelines." }
        });
        
        await prisma.auditLog.create({
            data: {
                id: crypto.randomUUID(),
                action: 'PHARMACY_REJECTED',
                entityType: 'PHARMACY',
                entityId: pharmacy.id,
                performedBy: req.user.id,
                metadata: {
                    adminName: req.user.name,
                    adminEmail: req.user.email,
                    pharmacyName: pharmacy.name,
                    reason: reason || "Did not meet platform guidelines."
                }
            }
        });

        res.json({ success: true, message: "Pharmacy application rejected." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not fetch audit logs." });
    }
};

exports.getRecentCustomers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not fetch customer registrations." });
    }
};

exports.getRecentPharmacies = async (req, res) => {
    try {
        const pharmacies = await prisma.pharmacy.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { owner: { select: { name: true, email: true } } }
        });
        res.status(200).json(pharmacies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not fetch pharmacy registrations." });
    }
};

// Get all pending pharmacies for the admin dashboard
exports.getPendingPharmacies = async (req, res) => {
  try {
    const pending = await prisma.pharmacy.findMany({
      where: { status: 'PENDING' },
      include: { owner: true }
    });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch pending requests." });
  }
};