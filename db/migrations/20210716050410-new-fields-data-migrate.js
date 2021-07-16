'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let allUpdates = [];
    let res = await queryInterface.sequelize.query('select id, data from Qualities');
    res[0].forEach(row => {
      let id = row['id'];
      let data = JSON.parse(row['data']);
      let name = data.name, notes = data.notes || '';
      delete data.name;
      delete data.notes;
      allUpdates.push(
        queryInterface.sequelize.query(
          `update Qualities set data='${JSON.stringify(data)}', name='${name}', notes='${notes}'
          where id=${id}`)
      );
    });
    return Promise.all(allUpdates);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
