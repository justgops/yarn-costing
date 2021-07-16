'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Qualities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Qualities.init({
    data: DataTypes.STRING,
    name: DataTypes.STRING,
    notes: DataTypes.STRING,
    agentId: DataTypes.INTEGER,
    partyId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Qualities',
  });
  return Qualities;
};