import { RentalOrder, Product, Users, Review } from '../models/index.js'; // tambah sequelize
import { Op } from 'sequelize';
import db from '../config/Database.js'; // sesuaikan path jika perlu
import { Sequelize } from 'sequelize';

export const createOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const { 
      productId, fullName, email, phone, rentDate, returnDate, quantity,
      pickupMethod, returnMethod, paymentMethod, note, estimatedPrice
    } = req.body;

    console.log('FILES:', req.files);
    console.log('BODY:', req.body);

    const rentDateObj = new Date(rentDate);
    const returnDateObj = new Date(returnDate);

    if (rentDateObj >= returnDateObj) {
      await t.rollback();
      return res.status(400).json({ error: 'Tanggal kembali harus setelah tanggal sewa' });
    }

    if (rentDateObj < new Date()) {
      await t.rollback();
      return res.status(400).json({ error: 'Tanggal sewa tidak boleh di masa lalu' });
    }

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    if (product.stock < quantity) {
      await t.rollback();
      return res.status(400).json({ error: 'Stok tidak mencukupi' });
    }

    const ktpFile = req.files?.ktp?.[0];
    const selfieFile = req.files?.selfie?.[0];

    if (!ktpFile || !selfieFile) {
      await t.rollback();
      return res.status(400).json({ error: 'Upload KTP dan Selfie wajib' });
    }

    const ktpPath = `uploads/${ktpFile.filename}`;
    const selfiePath = `uploads/${selfieFile.filename}`;

    // Kurangi stok produk
    await product.update({
      stock: product.stock - quantity
    }, { transaction: t });

    const order = await RentalOrder.create({
      userId: req.user.userId,
      productId,
      fullName,
      email,
      phone,
      rentDate: rentDateObj,
      returnDate: returnDateObj,
      quantity,
      pickupMethod,
      returnMethod,
      paymentMethod,
      ktpUrl: ktpPath,
      selfieUrl: selfiePath,
      note,
      estimatedPrice,
      status: 'pending'
    }, { transaction: t });

    await t.commit();
    res.status(201).json(order);
  } catch (error) {
    await t.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
};

// Get orders for admin
export const getAdminOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const orders = await RentalOrder.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'price', 'image']
        }
      ]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Gagal memuat data pesanan' });
  }
};

// Get user's orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await RentalOrder.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }
      ]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Gagal memuat data pesanan' });
  }
};

// Get order by ID with user or admin access
export const getOrderById = async (req, res) => {
  try {
    const whereCondition = {
      id: req.params.id,
      [Op.or]: [
        { userId: req.user.userId },
      ]
    };

    // Jika user adalah admin, boleh akses semua order
    if (req.user.role === 'admin') {
      delete whereCondition[Op.or];
      whereCondition.id = req.params.id;
    }

    const order = await RentalOrder.findOne({
      where: whereCondition,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'price', 'description', 'image']
        },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Gagal memuat detail pesanan' });
  }
};

// Confirm cash payment
export const confirmCashPayment = async (req, res) => {
  try {
    const order = await RentalOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: 'Pesanan harus sudah dikonfirmasi sebelum dibayar' });
    }

    await order.update({
      status: 'paid',
      paymentDate: new Date(),
      actualPaymentAmount: order.estimatedPrice
    });

    res.json({ message: 'Pembayaran berhasil dikonfirmasi', order });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Gagal mengkonfirmasi pembayaran' });
  }
};

// Start rental (set status jadi in_progress)
export const startRental = async (req, res) => {
  try {
    const order = await RentalOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ error: 'Pesanan belum dibayar' });
    }

    await order.update({
      status: 'in_progress'
    });

    res.json({ message: 'Penyewaan dimulai', order });
  } catch (error) {
    console.error('Error starting rental:', error);
    res.status(500).json({ error: 'Gagal memulai penyewaan' });
  }
};

// Complete order
export const completeOrder = async (req, res) => {
  try {
    const order = await RentalOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'in_progress') {
      return res.status(400).json({ error: 'Pesanan belum dalam masa penyewaan' });
    }

    await order.update({
      status: 'completed'
    });

    res.json({ message: 'Pesanan berhasil diselesaikan', order });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Gagal menyelesaikan pesanan' });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const order = await RentalOrder.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Hanya pesanan yang belum diproses yang dapat dibatalkan' });
    }

    await order.update({
      status: 'cancelled'
    });

    res.json({ message: 'Pesanan berhasil dibatalkan' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Gagal membatalkan pesanan' });
  }
};

// Update order status (general)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await RentalOrder.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    await order.update({ status });

    res.json({ message: 'Status pesanan berhasil diperbarui', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Gagal memperbarui status pesanan' });
  }
};

// Dashboard stats
// Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.count();

    const orderCounts = await RentalOrder.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const totalOrders = {
      pending: 0,
      confirmed: 0,
      paid: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    orderCounts.forEach(item => {
      const status = item.status;
      if (totalOrders.hasOwnProperty(status)) {
        totalOrders[status] = parseInt(item.get('count'), 10);
      }
    });

    const totalRevenue = await RentalOrder.sum('estimatedPrice', {
      where: { status: 'completed' }
    }) || 0;

    const paymentStatus = {
      paid: await RentalOrder.count({ where: { status: ['paid', 'in_progress', 'completed'] } }),
      unpaid: await RentalOrder.count({ where: { status: ['pending', 'confirmed'] } })
    };

    const revenueTrend = await RentalOrder.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('estimatedPrice')), 'revenue']
      ],
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: Sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 6 MONTH)')
        }
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'ASC']]
    });

    const recentOrdersRaw = await RentalOrder.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, attributes: ['name'], as: 'product' },
        { model: Users, attributes: ['name'], as: 'user' }
      ]
    });

    const recentOrders = recentOrdersRaw.map(order => ({
      id: order.id,
      productName: order.product?.name || '-',
      customerName: order.user?.name || '-',
      status: order.status,
      amount: order.estimatedPrice,
      date: order.createdAt
    }));

    // Tambahkan Statistik Pengguna:
    const totalUsers = await Users.count();
    const active = await Users.count({ where: { isActive: true } });
    const inactive = await Users.count({ where: { isActive: false } });
    const newThisMonth = await Users.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });
const allOrdersRaw = await RentalOrder.findAll({
  include: [
    { model: Product, as: 'product', attributes: ['name'] },
    { model: Users, as: 'user', attributes: ['name'] }
  ],
  order: [['createdAt', 'DESC']]
});

const allOrders = allOrdersRaw.map(order => ({
  id: order.id,
  productName: order.product?.name || '-',
  customerName: order.user?.name || '-',
  rentDate: order.rentDate,
  returnDate: order.returnDate,
  quantity: order.quantity,
  estimatedPrice: order.estimatedPrice,
  status: order.status
}));

    res.json({
  totalProducts,
  totalOrders,
  totalRevenue,
  paymentStatus,
  revenueTrend,
  recentOrders,
  totalUsers,
  userStats: {
    active,
    inactive,
    newThisMonth
  },
  allOrders // ← pastikan ini ada
});


  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Gagal memuat statistik dashboard' });
  }
};

export const submitReview = async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.user.userId;

  // Pastikan user pernah menyewa dan statusnya "completed"
  const completedOrder = await RentalOrder.findOne({
    where: {
      productId,
      userId,
      status: 'completed'
    }
  });

  if (!completedOrder) {
    return res.status(400).json({ error: 'Anda hanya bisa memberi ulasan setelah menyelesaikan sewa' });
  }

  const review = await Review.create({ productId, userId, rating, comment });
  res.status(201).json(review);
};
// Ambil semua data order untuk laporan
const allOrdersRaw = await RentalOrder.findAll({
  include: [
    { model: Product, as: 'product', attributes: ['name'] },
    { model: Users, as: 'user', attributes: ['name'] }
  ],
  order: [['createdAt', 'DESC']]
});

const allOrders = allOrdersRaw.map(order => ({
  id: order.id,
  productName: order.product?.name || '-',
  customerName: order.user?.name || '-',
  rentDate: order.rentDate,
  returnDate: order.returnDate,
  quantity: order.quantity,
  estimatedPrice: order.estimatedPrice,
  status: order.status
}));

export const getFilteredLaporan = async (req, res) => {
  try {
    const { range = 'monthly' } = req.query;
    const today = new Date();
    let startDate;

    switch (range) {
      case 'daily':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'yearly':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'monthly':
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const ordersRaw = await RentalOrder.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        { model: Product, as: 'product', attributes: ['name'] },
        { model: Users, as: 'user', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const allOrders = ordersRaw.map(order => ({
      id: order.id,
      productName: order.product?.name || '-',
      customerName: order.user?.name || '-',
      rentDate: order.rentDate,
      returnDate: order.returnDate,
      quantity: order.quantity,
      estimatedPrice: order.estimatedPrice,
      status: order.status
    }));

    res.json({ allOrders });
  } catch (err) {
    console.error('Gagal ambil laporan:', err);
    res.status(500).json({ error: 'Gagal memuat laporan' });
  }
};
