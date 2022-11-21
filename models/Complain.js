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
    orderNumber: {
        type: DataTypes.INTEGER,
    },
    queryNature: {
        type: DataTypes.STRING,
    },
    message: {
        type: DataTypes.TEXT,
    }
};

module.exports.relations = {
    belongsTo: [
        { table: 'User', foreignKey: 'userId' },
        { table: 'Product', foreignKey: 'productId' },
    ]
};