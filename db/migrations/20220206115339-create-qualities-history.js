'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('QualitiesHistory', {
      qid: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      srno: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      data: {
        type: Sequelize.TEXT
      },
      name: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.STRING
      },
      agentId: {
        type: Sequelize.INTEGER
      },
      partyId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('QualitiesHistory');
  }
};