// models/ReportModel.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const Report = db.define("Report", {
  reporterId: DataTypes.INTEGER, // Admin
  reportedUserId: DataTypes.INTEGER,
  reason: DataTypes.STRING
});

export default Report;
