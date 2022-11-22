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
    name: {
        type: DataTypes.STRING
        // unique: true
    },
    image: {
        type: DataTypes.STRING,
    },
    subimages: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING
    },
    weight: {
        type: DataTypes.INTEGER,  // 60pt, 90pt
    },
    price: {
        type: DataTypes.INTEGER,
    },
    sale: {
        type: DataTypes.BOOLEAN,  // discount
    },
    salePrice: {
        type: DataTypes.INTEGER,
    },
    description: {
        type: DataTypes.TEXT,
    },
    unit: {
        type: DataTypes.STRING  // single item or box of item
    },
    productCode: {
        type: DataTypes.INTEGER
    },
    stock: {
        type: DataTypes.INTEGER
    },
    conditions: {
        type: DataTypes.STRING  // High BP, Depression
    },
    howToUse: {
        type: DataTypes.STRING
    },
    additionInfo: {
        type: DataTypes.STRING
    },
    rating: {
        type: DataTypes.FLOAT
    },
};

module.exports.isPublic = true;