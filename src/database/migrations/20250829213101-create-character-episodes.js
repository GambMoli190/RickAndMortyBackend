'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('character_episodes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      character_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'characters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      episode_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'episodes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Índice compuesto para evitar duplicados
    await queryInterface.addIndex('character_episodes', ['character_id', 'episode_id'], {
      unique: true,
      name: 'unique_character_episode'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('character_episodes');
  }
};