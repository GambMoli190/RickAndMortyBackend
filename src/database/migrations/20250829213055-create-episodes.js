'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('episodes', {
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
      air_date: {
        type: Sequelize.STRING,
        allowNull: true
      },
      episode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Episode code like S01E01'
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      characters: {
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
    await queryInterface.addIndex('episodes', ['episode']);
    await queryInterface.addIndex('episodes', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('episodes');
  }
};