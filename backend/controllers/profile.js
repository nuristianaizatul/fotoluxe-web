import bcrypt from 'bcrypt';
import { Users, Profile } from '../models/index.js';

// Ambil profile lengkap user (gabungan user + profile)
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await Profile.findOne({
      where: { userId },
      include: [{
        model: Users,
        attributes: ['name', 'email']
      }]
    });

    if (!profile) {
      return res.status(404).json({ msg: 'Profil tidak ditemukan' });
    }

    console.log('✅ Data profil dengan User:', JSON.stringify(profile, null, 2));
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ msg: 'Terjadi kesalahan server' });
  }
};

// Update profile (hanya field di profile, bukan nama/email di user)
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phone, gender, address, birthdate } = req.body;
    
    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

    let profile = await Profile.findOne({ where: { userId } });

    if (!profile) {
      profile = await Profile.create({
        userId,
        phone,
        gender,
        address,
        birthdate,
        photo
      });
    } else {
      await profile.update({
        phone,
        gender,
        address,
        birthdate,
        ...(photo && { photo })
      });
    }

    res.json({ 
      msg: 'Profil berhasil diperbarui',
      photoUrl: photo || profile.photo
    });
  } catch (error) {
    res.status(500).json({ msg: 'Gagal memperbarui profil', error: error.message });
  }
};


// Ganti password user
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password baru harus minimal 6 karakter' });
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await Users.update({ password: hashPassword }, { where: { id: userId } });

    res.json({ msg: 'Password berhasil diperbarui' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ msg: 'Terjadi kesalahan server' });
  }
};
