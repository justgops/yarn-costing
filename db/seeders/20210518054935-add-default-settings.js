'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('Settings');
      await queryInterface.bulkInsert('Settings', [{
        value: JSON.stringify({
          "lassa_unit":"meter",
          "yarn_rate_gst": 5,
          "sizing_rate_gst": 5,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    } catch(e) {
      console.log('Error occurred', e.message);
      throw 'Database error';
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
