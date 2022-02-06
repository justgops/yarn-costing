'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn(
      'Qualities',
      'data',
      {
        type: Sequelize.TEXT,
      },
    );

    let allUpdates = [];
    let res = await queryInterface.sequelize.query('select id, data from Qualities');
    res[0].forEach(row => {
      let id = row['id'];
      let data = JSON.parse(row['data']);
      let fabricType = data.fabric_type;
      delete data.fabric_type;

      for (const warp of data.warps||[]) {
        warp.fabric_type = fabricType;
      }

      for (const weft of data.wefts||[]) {
        weft.fabric_type = fabricType;
      }

      allUpdates.push(
        queryInterface.sequelize.query(
          `update Qualities set data='${JSON.stringify(data)}' where id=${id}`)
      );
    });
    return Promise.all(allUpdates);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
