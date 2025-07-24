// File: controllers/Users.js
import { Op } from "sequelize";
import Users from "../models/UserModel.js";
import Profile from "../models/ProfileModel.js";
import Report from "../models/ReportModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email']
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const Register = async (req, res) => {
  const { name, email, password, confPassword } = req.body;

  if (!name || !email || !password || !confPassword) {
    return res.status(400).json({ msg: "Semua field harus diisi" });
  }

  if (password !== confPassword) {
    return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: "Password minimal 6 karakter" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Email tidak valid" });
  }

  try {
    const existingUser = await Users.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: "Email sudah digunakan" });
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await Users.create({
      name,
      email,
      password: hashPassword
    });

    await Profile.create({ userId: newUser.id });

    res.status(201).json({ msg: "Register Berhasil" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

// ... (import tetap sama)

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email dan password harus diisi" });
    }

    const user = await Users.findOne({ where: { email } });
    if (!user) return res.status(404).json({ msg: "Email tidak ditemukan" });
    
    if (!user.isActive) {
      return res.status(403).json({ msg: "Akun ini dinonaktifkan" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Password salah" });

    const userId = user.id;
    const name = user.name;
    const role = user.role || 'customer';

    const accessToken = jwt.sign(
      { userId, name, email, role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId, name, email, role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    );

    await Users.update({ refresh_token: refreshToken }, { where: { id: userId } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: { userId, name, email, role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

// ... (fungsi lainnya tetap sama)
export const Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(204);

    const user = await Users.findOne({ where: { refresh_token: refreshToken } });
    if (!user) return res.sendStatus(204);

    await Users.update({ refresh_token: null }, { where: { id: user.id } });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
    });

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

// Tambahan fungsi delete akun
export const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    await Profile.destroy({ where: { userId } });
    await Users.destroy({ where: { id: userId } });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
    });

    res.json({ msg: "Akun berhasil dihapus" });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ msg: "Pengguna tidak ditemukan" });
    }

    await Users.destroy({ where: { id } });
    res.json({ msg: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

// Nonaktifkan akun (soft delete)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    await Users.update({ isActive: false }, { where: { id } });

    res.json({ msg: "User berhasil dinonaktifkan" });
  } catch (error) {
    console.error("Deactivate error:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
export const reportUser = async (req, res) => {
  const reporterId = req.user.userId; // Dari token
  const { userId } = req.params; // Yang dilaporkan
  const { reason } = req.body;

  try {
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ msg: "Alasan harus diisi" });
    }

    await Report.create({
      reporterId,
      reportedUserId: userId,
      reason
    });

    res.json({ msg: "User berhasil dilaporkan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal melaporkan user" });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: Users, as: 'Reporter', attributes: ['name'] },
        { model: Users, as: 'ReportedUser', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const result = reports.map(r => ({
      id: r.id,
      reporterName: r.Reporter.name,
      reportedName: r.ReportedUser.name,
      reason: r.reason,
      createdAt: r.createdAt
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Gagal mengambil laporan' });
  }
};

// Tambahkan fungsi baru untuk statistik user
export const getUserStats = async (req, res) => {
  try {
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

    res.json({ totalUsers, active, inactive, newThisMonth });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Gagal mengambil statistik pengguna" });
  }
};
