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
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: 'productId'
    },
    productName: {
        type: DataTypes.INTEGER
    },
    quantity: {
        type: DataTypes.INTEGER
    },
    unitPrice: {
        type: DataTypes.INTEGER
    },
    tax: {
        type: DataTypes.FLOAT
    },
    sellPrice: {
        type: DataTypes.FLOAT
    },
    totalPrice: {
        type: DataTypes.INTEGER
    }
};

module.exports.relations = {
    belongsTo: [
        { table: 'Order', foreignKey: 'orderId' },
    ]
};