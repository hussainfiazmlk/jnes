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
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  fullName: {
    type: DataTypes.STRING
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: "userName"
  },
  email: {
    type: DataTypes.STRING,
    required: true,
    allowNull: true,
    unique: "email",
    validate: {
      isEmail: {
        args: true,
        msg: "Email is not Valid",
      },
    },
  },
  mobileNo: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
  resetCode: {
    type: DataTypes.INTEGER,
  },
  image: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING
  },
};

module.exports.relations = {
  hasMany: [
    { table: "Order", as: "orders", foreignKey: "userId" },
    { table: "Blog", as: "blogs", foreignKey: "userId" }
  ]
};
