const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, legalStoreName, latitude, longitude, address, city, state, pincode } = req.body;    
    
    // 🚀 NEW: Check if the email is already taken before doing anything else
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists. Please log in or use a different email." });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create User
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'CUSTOMER' }
    });

    // Handle Pharmacy Owner logic
    if (role === 'OWNER') {
      await prisma.pharmacy.create({
        data: {
          ownerId: newUser.id,
          name: legalStoreName || name,
          status: 'PENDING',
          licenseNumber: `PENDING-${newUser.id}`,
          address: address && address.trim() ? address.trim() : "PENDING",
          city: city && city.trim() ? city.trim() : "PENDING",
          state: state && state.trim() ? state.trim() : "PENDING",
          pincode: pincode && pincode.trim() ? pincode.trim() : "000000",
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          gstDocumentUrl: req.files?.['gstDocument']?.[0]?.filename || null,
          panDocumentUrl: req.files?.['panDocument']?.[0]?.filename || null,
          licenseDocumentUrl: req.files?.['licenseDocument']?.[0]?.filename || null,
          addressProofUrl: req.files?.['addressProof']?.[0]?.filename || null
        }
      });
    }

    res.status(201).json({ message: "Registration successful", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Fetch user and include their Pharmacy data
    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { Pharmacy: true } 
    });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 🚀 NEW: Admin Pipeline / Waiting Room Logic
    if (user.role === 'OWNER' && user.Pharmacy && user.Pharmacy.length > 0) {
      const pharmacy = user.Pharmacy[0];
      
      if (pharmacy.status === 'PENDING') {
        // Send a special flag to the frontend to redirect to the waiting page
        return res.json({ 
          success: true, 
          status: 'PENDING',
          redirect: 'pending-approval.html' 
        });
      }
      
      if (pharmacy.status === 'REJECTED') {
        // Block login entirely and show the reason
        return res.status(403).json({ 
          error: `Application Rejected. Reason: ${pharmacy.rejectionReason || 'Please contact support.'}` 
        });
      }
    }

    // Standard Login for Admins, Customers, and APPROVED Owners
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, name: user.name, role: user.role, Pharmacy: user.Pharmacy },
      redirect: user.role === 'ADMIN' ? 'admin-dashboard.html' : (user.role === 'OWNER' ? 'pharmacy-dashboard.html' : 'index.html')
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(user);
};