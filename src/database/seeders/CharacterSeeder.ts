import { RickAndMortyService, RickAndMortyCharacter } from '../../services/RickAndMortyService';

// Importar desde el index para asegurar que las asociaciones están definidas
import { Character, Origin, Location, Episode } from '../models/index';

export class CharacterSeeder {
  private rickAndMortyService: RickAndMortyService;

  constructor() {
    this.rickAndMortyService = new RickAndMortyService();
  }

  /**
   * Pobla la base de datos con 15 personajes de Rick and Morty
   */
  async seed(): Promise<void> {
    try {
      console.log('Starting character seeding...');

      // Verificar si ya hay personajes en la BD
      const existingCharacters = await Character.count();
      if (existingCharacters > 0) {
        console.log(`Database already has ${existingCharacters} characters. Skipping seeding.`);
        return;
      }

      // Obtener los primeros 15 personajes de la API
      const apiCharacters = await this.rickAndMortyService.getFirst15Characters();
      console.log(`Fetched ${apiCharacters.length} characters from API`);

      // Procesar cada personaje
      for (const apiCharacter of apiCharacters) {
        await this.processCharacter(apiCharacter);
      }

      console.log('Character seeding completed successfully');
    } catch (error) {
      console.error('Error during character seeding:', error);
      throw error;
    }
  }

  /**
   * Procesa un personaje individual y lo guarda en la BD con sus relaciones
   */
  private async processCharacter(apiCharacter: RickAndMortyCharacter): Promise<void> {
    try {
      // Procesar origin
      let originId: number | null = null;
      if (apiCharacter.origin.name !== 'unknown') {
        const origin = await this.findOrCreateOrigin(apiCharacter.origin);
        originId = origin.id;
      }

      // Procesar location
      let locationId: number | null = null;
      if (apiCharacter.location.name !== 'unknown') {
        const location = await this.findOrCreateLocation(apiCharacter.location);
        locationId = location.id;
      }

      // Crear el personaje
      const character = await Character.create({
        externalId: apiCharacter.id,
        name: apiCharacter.name,
        status: apiCharacter.status,
        species: apiCharacter.species,
        type: apiCharacter.type || '',
        gender: apiCharacter.gender,
        originId: originId || undefined,
        locationId: locationId || undefined,
        image: apiCharacter.image,
        url: apiCharacter.url,
        apiCreated: new Date(apiCharacter.created),
      });

      // Procesar episodes
      await this.processCharacterEpisodes(character, apiCharacter.episode);

      console.log(`Processed character: ${character.name}`);
    } catch (error) {
      console.error(`Error processing character ${apiCharacter.name}:`, error);
      throw error;
    }
  }

  /**
   * Encuentra o crea un origin
   */
  private async findOrCreateOrigin(originData: { name: string; url: string }): Promise<Origin> {
    const [origin] = await Origin.findOrCreate({
      where: { name: originData.name },
      defaults: {
        name: originData.name,
        url: originData.url,
      }
    });
    return origin;
  }

  /**
   * Encuentra o crea una location
   */
  private async findOrCreateLocation(locationData: { name: string; url: string }): Promise<Location> {
    const [location] = await Location.findOrCreate({
      where: { name: locationData.name },
      defaults: {
        name: locationData.name,
        url: locationData.url,
      }
    });
    return location;
  }

  /**
   * Procesa los episodios de un personaje
   */
  private async processCharacterEpisodes(character: Character, episodeUrls: string[]): Promise<void> {
    const episodes: Episode[] = [];

    for (const episodeUrl of episodeUrls.slice(0, 5)) { // Limitar a 5 episodios por personaje
      try {
        // Extraer información básica del URL (para no hacer muchas requests)
        const episodeId = episodeUrl.split('/').pop();
        const episodeName = `Episode ${episodeId}`;
        const episodeCode = `S0${Math.ceil(parseInt(episodeId!) / 10)}E${String(parseInt(episodeId!) % 10 || 10).padStart(2, '0')}`;

        const [episode] = await Episode.findOrCreate({
          where: { episode: episodeCode },
          defaults: {
            name: episodeName,
            episode: episodeCode,
            url: episodeUrl,
          }
        });

        episodes.push(episode);
      } catch (error) {
        console.warn(`Error processing episode ${episodeUrl}:`, error);
      }
    }

    if (episodes.length > 0) {
      await character.setEpisodes(episodes);
    }
  }
}