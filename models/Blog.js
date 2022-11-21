const { DataTypes } = require("sequelize");

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
  author: {
    type: DataTypes.STRING,
  },
  title: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.STRING,
  },
  shortDesciption: {
    type: DataTypes.TEXT,
  },
  description: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
};

module.exports.relations = {
  belongsTo: [{ table: "User", foreignKey: "userId" }],
};
