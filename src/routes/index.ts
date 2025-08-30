import { Router } from 'express';
import { Character } from '../database/models/Character';
import { Origin } from '../database/models/Origin';
import { Location } from '../database/models/Locations';
import { Episode } from '../database/models/Episode';
import { CharacterUpdateJob } from '../jobs/updateCharacters';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Rick and Morty API is running!',
    timestamp: new Date().toISOString()
  });
});

// Database stats endpoint
router.get('/db-stats', async (req, res) => {
  try {
    const stats = {
      characters: await Character.count(),
      origins: await Origin.count(),
      locations: await Location.count(),
      episodes: await Episode.count(),
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Manual character update endpoint
router.post('/update-characters', async (req, res) => {
  try {
    const updateJob = new CharacterUpdateJob();
    await updateJob.runNow();

    res.json({
      success: true,
      message: 'Characters updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update characters',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;