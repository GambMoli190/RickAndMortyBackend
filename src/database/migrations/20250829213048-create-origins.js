'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('origins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dimension: {
        type: Sequelize.STRING,
        allowNull: true
      },
      residents: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para mejorar performance
    await queryInterface.addIndex('origins', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('origins');
  }
};