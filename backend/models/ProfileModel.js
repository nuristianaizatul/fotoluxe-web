import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const Profile = db.define('profiles', {
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  birthdate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
photo: {
  type: DataTypes.STRING,
  allowNull: true
},
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
}, {
  freezeTableName: true,
  timestamps: true
});

export default Profile;
