'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SizingSets extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SizingSets.init({
    setNo: DataTypes.INTEGER,
    sizingId: DataTypes.INTEGER,
    qid: DataTypes.INTEGER,
    name: DataTypes.STRING,
    data: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'SizingSets',
  });
  return SizingSets;
};