const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(express.json());

// Inisialisasi Firebase Admin dengan Environment Variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Menangani karakter newline (\n) pada private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
    }),
  });
}

const db = admin.firestore();
const COLLECTION_NAME = 'books';

// GET: Ambil daftar semua buku
app.get('/api/books', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const books = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Tambah buku baru
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, year } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: 'Judul dan Penulis wajib diisi' });
    }

    const newBook = {
      title,
      author,
      year: Number(year) || new Date().getFullYear(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION_NAME).add(newBook);
    res.status(201).json({ id: docRef.id, ...newBook });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Hapus buku berdasarkan ID
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(COLLECTION_NAME).doc(id).delete();
    res.status(200).json({ message: 'Buku berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;