'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Misc extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Misc.init({
    install_date_enc: DataTypes.STRING,
    activation_date_enc: DataTypes.STRING,
    system_id: DataTypes.STRING,
    activation_key: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Misc',
  });
  return Misc;
};