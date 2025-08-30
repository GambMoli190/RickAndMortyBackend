'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('characters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      external_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        comment: 'ID from Rick and Morty API'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Alive', 'Dead', 'unknown'),
        allowNull: false
      },
      species: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: ''
      },
      gender: {
        type: Sequelize.ENUM('Female', 'Male', 'Genderless', 'unknown'),
        allowNull: false
      },
      origin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'origins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      api_created: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Created date from API'
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

    // Índices para filtros requeridos
    await queryInterface.addIndex('characters', ['status']);
    await queryInterface.addIndex('characters', ['species']);
    await queryInterface.addIndex('characters', ['gender']);
    await queryInterface.addIndex('characters', ['name']);
    await queryInterface.addIndex('characters', ['external_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('characters');
  }
};