// controllers/Product.js
import { Sequelize } from 'sequelize';
import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import Review from '../models/ReviewModel.js';
import Users from '../models/UserModel.js';


// Get all products with category
export const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        }
      ]
    });

    // Ambil semua rating per product sekaligus
    const ratings = await Review.findAll({
      attributes: [
        'productId',
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'reviewCount']
      ],
      group: ['productId'],
      raw: true
    });

    // Buat map productId → rating info
    const ratingMap = {};
    for (const r of ratings) {
      ratingMap[r.productId] = {
        averageRating: parseFloat(r.averageRating),
        reviewCount: parseInt(r.reviewCount)
      };
    }

    // Gabungkan ke masing-masing produk
    const enrichedProducts = products.map(product => {
      const rating = ratingMap[product.id] || { averageRating: 0, reviewCount: 0 };
      return {
        ...product.toJSON(),
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount
      };
    });

    res.json(enrichedProducts);
  } catch (error) {
    console.error('Error in getProducts:', error.message, error);
    res.status(500).json({ msg: "Gagal mengambil data produk" });
  }
};

// Get product by ID with category
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      attributes: {
        include: [
          [Sequelize.fn('AVG', Sequelize.col('Reviews.rating')), 'averageRating'],
          [Sequelize.fn('COUNT', Sequelize.col('Reviews.id')), 'reviewCount']
        ]
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name']
        },
        {
          model: Review,
          attributes: []
        }
      ],
      group: ['products.id', 'category.id'] // ✅ fix alias here
    });

    if (!product) return res.status(404).json({ msg: "Produk tidak ditemukan" });
    res.json(product);
  } catch (error) {
    console.error('Error in getProductById:', error.message);
    res.status(500).json({ msg: "Gagal mengambil data produk" });
  }
};

// Create product with image upload
export const createProduct = async (req, res) => {
  const { name, price, description, categoryId, stock } = req.body;
  const image = req.file ? req.file.filename : null;
  try {
    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(400).json({ msg: "Kategori tidak ditemukan" });

    await Product.create({ name, price, description, categoryId, image, stock });
    res.status(201).json({ msg: "Produk berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menambahkan produk" });
  }
};

// Update product with image upload
export const updateProduct = async (req, res) => {
  const { name, price, description, categoryId, stock } = req.body;
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ msg: "Produk tidak ditemukan" });

    const image = req.file ? req.file.filename : product.image;

    await product.update({ name, price, description, categoryId, image, stock });
    res.json({ msg: "Produk berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal memperbarui produk" });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ msg: "Produk tidak ditemukan" });

    await product.destroy();
    res.json({ msg: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus produk" });
  }
};

// Get product reviews
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.id },
      include: [
        { 
          model: Users,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ msg: "Gagal mengambil ulasan produk" });
  }
};

