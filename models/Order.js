const { DataTypes } = require('sequelize');

module.exports.definition = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    archive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    address: {
        type: DataTypes.STRING
    },
    paymentMethod: {
        type: DataTypes.ENUM('card', 'cash')
    },
    price: {
        type: DataTypes.INTEGER
    },
    tax: {
        type: DataTypes.INTEGER,
    },
    discount: {
        type: DataTypes.INTEGER
    },
    promoCode: {
        type: DataTypes.STRING,
    },
    shippingPrice: {
        type: DataTypes.INTEGER
    },
    totalAmount: {
        type: DataTypes.INTEGER
    },
};

module.exports.relations = {
    hasMany: [
        { table: 'OrderDetail', as: "orderDetails", foreignKey: "orderId" },
    ],
    belongsTo: [
        { table: 'User', foreignKey: 'userId' },
    ]
};