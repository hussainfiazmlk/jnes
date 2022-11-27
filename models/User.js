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
  username: {
    type: DataTypes.STRING,
    unique: "username"
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "email",
    validate: {
      isEmail: {
        args: true,
        msg: "Email is not Valid",
      },
    },
  },
  emailVerificationCode: {
    type: DataTypes.INTEGER
  },
  mobileNo: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'loggedIn'
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
  }
};

module.exports.relations = {
  hasMany: [
    { table: "Order", as: "orders", foreignKey: "userId" },
    { table: "Blog", as: "blogs", foreignKey: "userId" }
  ]
};
