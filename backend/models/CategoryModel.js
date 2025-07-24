// models/CategoryModel.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const Category = db.define('categories', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  freezeTableName: true
});

export default Category;
