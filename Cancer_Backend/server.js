import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import Patient from './models/Patient.js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
} catch (err) {
  console.error('MongoDB connection error:', err);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.body.patientId;
    const dir = path.join(__dirname, 'uploads', patientId, 'biopsy');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.post('/patients', upload.single('file'), async (req, res) => {
  try {
    const { patientId, name, age, weight, height } = req.body;
    const biopsyImagePath = req.file.path;

    const patient = new Patient({
      patientId,
      name,
      age,
      weight,
      height,
      biopsyImagePath
    });

    await patient.save();
    res.json({ message: 'Patient saved successfully', patientId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save patient' });
  }
});

app.get('/patients/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
