import { DataTypes } from 'sequelize';
import db from '../config/Database.js';
const Review = db.define('Review', {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['productId', 'userId']  // kombinasi unik
    }
  ]
});
export default Review;