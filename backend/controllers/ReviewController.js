// controllers/ReviewController.js
import Review from '../models/ReviewModel.js';

export const createReview = async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.userId; // Pastikan userId berasal dari middleware auth

  try {
    // Cek kalau sudah ada review dari user ini untuk produk yang sama
    const existingReview = await Review.findOne({
      where: { productId, userId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Kamu sudah memberi ulasan untuk produk ini.' });
    }

    await Review.create({
      productId,
      userId,
      rating,
      comment
    });

    res.status(201).json({ message: 'Ulasan berhasil ditambahkan' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ulasan untuk produk ini sudah ada.' });
    }

    console.error(error);
    res.status(500).json({ error: 'Gagal menambahkan ulasan' });
  }
};
