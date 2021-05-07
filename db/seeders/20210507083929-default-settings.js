'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
   try {
    await queryInterface.bulkInsert('Settings', [{
      value: JSON.stringify({"length_per_count": 1693.33}),
      createdAt: new Date(),
      updatedAt: new Date(),
    }])
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
