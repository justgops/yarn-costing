'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Qualities',
      'name',
      {
        type: Sequelize.STRING,
      },
    );
    await queryInterface.addColumn(
      'Qualities',
      'notes',
      {
        type: Sequelize.STRING,
      },
    );
    await queryInterface.addColumn(
      'Qualities',
      'agentId',
      {
        type: Sequelize.INTEGER,
      },
    );
    await queryInterface.addColumn(
      'Qualities',
      'partyId',
      {
        type: Sequelize.INTEGER,
      },
    );
  },

  down: async (queryInterface, Sequelize) => {
  }
};
