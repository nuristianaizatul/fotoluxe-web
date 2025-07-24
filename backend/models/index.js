// associations.js

import Users from './UserModel.js';
import Profile from './ProfileModel.js';
import RentalOrder from './RentalOrder.js';
import Product from './ProductModel.js';
import Review from './ReviewModel.js';


// Relasi Users dan Profile
Users.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(Users, { foreignKey: 'userId' });

// Relasi RentalOrder dan Product
RentalOrder.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(RentalOrder, { foreignKey: 'productId', as: 'rentalOrders' });

// Relasi RentalOrder dan Users (optional, jika kamu mau)
// Contohnya:
RentalOrder.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Users.hasMany(RentalOrder, { foreignKey: 'userId', as: 'rentalOrders' });

Review.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Review, { foreignKey: 'productId' });


export { Users, Profile, RentalOrder, Product, Review };
