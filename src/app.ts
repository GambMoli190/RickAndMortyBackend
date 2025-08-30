import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { connectDatabase, sequelize } from './config/db-simple';
import { graphqlHandler } from './graphql/setup';
import routes from './routes';
import { detailedLoggingMiddleware } from './middleware/detailedLogger';
import { graphqlTimingMiddleware } from './middleware/graphqlTiming';
import { CharacterUpdateJob } from './jobs/updateCharacters';
import './database/models'; // Cargar modelos y asociaciones

async function startApp() {
  try {
    console.log('Starting Rick and Morty API...');

    const app = express();

    // Database setup
    await initializeDatabase();

    // Middleware
    setupMiddleware(app);

    // Routes
    setupRoutes(app);

    // Start server
    startServer(app);

  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1);
  }
}

async function initializeDatabase() {
  await connectDatabase();
  console.log('Database connected');

  await sequelize.sync({ alter: true });
  console.log('Tables synchronized');

  if (config.isDevelopment) {
    try {
      const { CharacterSeeder } = await import('./database/seeders/CharacterSeeder');
      const seeder = new CharacterSeeder();
      await seeder.seed();
    } catch (error) {
      console.warn('Seeder warning:', error);
    }
  }
}

function setupMiddleware(app: express.Application) {
  app.use(cors());
  app.use(express.json());

  // Middleware de logging detallado (antes de las rutas)
  app.use(detailedLoggingMiddleware);

  // Middleware específico para timing de GraphQL
  app.use(graphqlTimingMiddleware);
}

function setupRoutes(app: express.Application) {
  // REST routes
  app.use('/', routes);

  // GraphQL
  app.use('/graphql', graphqlHandler);
}

function startServer(app: express.Application) {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
    console.log(`GraphQL: http://localhost:${config.PORT}/graphql`);
    console.log(`Health: http://localhost:${config.PORT}/health`);
    console.log(`Stats: http://localhost:${config.PORT}/db-stats`);
    console.log('Ready to accept connections');

    // Iniciar cron job para actualizaciones automáticas
    if (config.isDevelopment || config.isProduction) {
      const updateJob = new CharacterUpdateJob();
      updateJob.start();
    }
  });
}

// Start the app
startApp();