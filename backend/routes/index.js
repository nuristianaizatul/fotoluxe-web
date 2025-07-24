import express from "express";
import {
  getCategories, createCategory, updateCategory, deleteCategory
} from "../controllers/Category.js";

import {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct
} from '../controllers/Product.js';
import { startRental } from '../controllers/OrderControllers.js';
import { getDashboardStats, getFilteredLaporan } from '../controllers/OrderControllers.js';
import  { upload, uploadOrderFiles, handleUploadErrors } from '../middleware/upload.js';
import { refreshToken } from "../controllers/RefreshToken.js";
import { verifyToken } from "../middleware/VerifyToken.js";
import {
  getUsers,
  Register,
  Login,
  Logout,
  deleteMyAccount,
  deleteUser,
  deactivateUser,
  reportUser
} from "../controllers/Users.js";
import { getMyProfile, updateMyProfile, changePassword } from "../controllers/profile.js";
import Users from "../models/UserModel.js";
import { 
  createOrder, 
  updateOrderStatus,
  getMyOrders,
  getOrderById,
  confirmCashPayment,
  completeOrder,
  cancelOrder,
  getAdminOrders,
  submitReview
} from "../controllers/OrderControllers.js";
import { getProductReviews } from '../controllers/Product.js';
import { createReview } from '../controllers/ReviewController.js';
import { getUserStats } from "../controllers/Users.js";

const router = express.Router();

// ===== Kategori Routes =====
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ===== Produk Routes =====
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', upload.single('image'), handleUploadErrors, createProduct);
router.put('/products/:id', upload.single('image'), handleUploadErrors, updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/products/:id/reviews', getProductReviews);
router.post('/reviews', verifyToken, submitReview);



// ===== Users Routes =====
router.get('/users', verifyToken, getUsers);
router.post('/users', Register);
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', Logout);
router.delete('/users/:id', verifyToken, deleteUser);
router.put('/users/:id/deactivate', verifyToken, deactivateUser);
router.post('/users/:userId/report', verifyToken, reportUser);


// ===== Profile (Protected) =====
router.get('/my-profile', verifyToken, getMyProfile);
router.put('/my-profile', verifyToken, upload.single('photo'), handleUploadErrors, updateMyProfile);
router.put('/change-password', verifyToken, changePassword);
router.delete('/my-profile', verifyToken, deleteMyAccount);

// ===== Orders Routes =====
// Customer routes
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/my-orders/:id', verifyToken, getOrderById);
router.post('/my-orders', verifyToken, uploadOrderFiles, handleUploadErrors, createOrder);
router.put('/my-orders/:id/cancel', verifyToken, cancelOrder);





// Admin routes
router.get('/admin/orders', verifyToken, getAdminOrders);
router.put('/admin/orders/:id/status', verifyToken, updateOrderStatus);
router.put('/admin/orders/:id/confirm-payment', verifyToken, confirmCashPayment);
router.put('/admin/orders/:id/complete', verifyToken, completeOrder);
router.put('/admin/orders/:id/start', verifyToken, startRental);
router.get('/admin/dashboard', verifyToken, getDashboardStats);
router.get('/admin/user-stats', verifyToken, getUserStats);
router.get('/laporan', verifyToken, getFilteredLaporan);

// Force logout
router.delete('/users/:userId/force-logout', verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    await Users.update({ refresh_token: null }, { where: { id: userId } });
    res.json({ msg: "User berhasil di-logout secara paksa" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Gagal force logout user" });
  }
});

export default router;