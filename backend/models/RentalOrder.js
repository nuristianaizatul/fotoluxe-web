import { DataTypes } from 'sequelize';
import db from '../config/Database.js';

const RentalOrder = db.define('RentalOrder', {
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  productId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  fullName: { 
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  pickupMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Ambil di toko'
  },
  returnMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Antar ke toko'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Bayar di tempat'
  },
  ktpUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  selfieUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT
  },
  estimatedPrice: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending',       // Menunggu konfirmasi
      'confirmed',     // Dikonfirmasi admin
      'paid',         // Sudah dibayar (untuk bayar di tempat)
      'in_progress',   // Sedang berjalan (barang disewa)
      'completed',     // Selesai (barang dikembalikan)
      'cancelled'     // Dibatalkan
    ),
    defaultValue: 'pending'
  },
  paymentDate: {
    type: DataTypes.DATE
  },
  actualPaymentAmount: {
    type: DataTypes.INTEGER
  },
  adminNotes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'rental_orders',
  timestamps: true, // Aktifkan createdAt dan updatedAt
  paranoid: true   // Aktifkan soft delete (jika diperlukan)
});

export default RentalOrder;