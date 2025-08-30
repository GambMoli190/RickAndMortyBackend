import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'rickandmorty', // database
  process.env.DB_USER || 'postgres',     // username
  process.env.DB_PASSWORD, // password
  {
    host: process.env.DB_HOST,
    port: 14065,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: true,
      underscored: true,
    }
  }
);

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

console.log('Database configuration loaded');