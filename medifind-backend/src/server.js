const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const medicineRoutes = require('./routes/medicines');
const pharmacyRoutes = require('./routes/pharmacies');
const reservationRoutes = require('./routes/reservations');
const prescriptionRoutes = require('./routes/prescriptions');

// Replace app.use(cors()) with this to be safe
app.use(cors({ origin: 'http://127.0.0.1:5500' }));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(5000, () => {
  console.log('🚀 MediFind secure core listening cleanly on port 5000');
});