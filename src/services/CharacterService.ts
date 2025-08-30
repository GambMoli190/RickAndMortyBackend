import { CharacterRepository, CharacterFilters } from '../repositories/CharacterRepository';
import { CacheService } from './CacheService';
import { Character } from '../database/models/Character';

export class CharacterService {
  private repository: CharacterRepository;
  private cache: CacheService;

  constructor() {
    this.repository = new CharacterRepository();
    this.cache = CacheService.getInstance(); // Usar Singleton
  }

  async getAllCharacters(filters?: CharacterFilters): Promise<Character[]> {
    const cacheKey = this.cache.generateKey('characters_db', filters || {});

    // Intentar obtener del cache
    const cached = await this.cache.get<Character[]>(cacheKey);
    if (cached) {
      console.log('Cache hit for filtered characters from database');
      return cached;
    }

    console.log('Cache miss - Fetching characters from database');
    const characters = await this.repository.findAll(filters);

    // Guardar en cache
    await this.cache.set(cacheKey, characters, 1800); // 30 minutos

    console.log(`Fetched ${characters.length} characters from database`);
    return characters;
  }

  async getCharacterById(id: number): Promise<Character | null> {
    const cacheKey = this.cache.generateKey('character_db_by_id', id);

    // Intentar obtener del cache
    const cached = await this.cache.get<Character>(cacheKey);
    if (cached) {
      console.log(`Cache hit for character ID: ${id} from database`);
      return cached;
    }

    console.log(`Cache miss - Fetching character ID: ${id} from database`);
    const character = await this.repository.findById(id);

    if (character) {
      // Guardar en cache
      await this.cache.set(cacheKey, character, 1800); // 30 minutos
      console.log(`Character found in database: ${character.name}`);
    } else {
      console.log(`Character with ID ${id} not found in database`);
    }

    return character;
  }

  async getCharacterByExternalId(externalId: number): Promise<Character | null> {
    const cacheKey = this.cache.generateKey('character_db_by_external_id', externalId);

    const cached = await this.cache.get<Character>(cacheKey);
    if (cached) {
      console.log(`Cache hit for character external ID: ${externalId} from database`);
      return cached;
    }

    console.log(`Cache miss - Fetching character external ID: ${externalId} from database`);
    const character = await this.repository.findByExternalId(externalId);

    if (character) {
      await this.cache.set(cacheKey, character, 1800);
      console.log(`Character found in database: ${character.name}`);
    }

    return character;
  }

  async getFirst15Characters(): Promise<Character[]> {
    const cacheKey = 'first_15_characters_db';

    const cached = await this.cache.get<Character[]>(cacheKey);
    if (cached) {
      console.log('Cache hit for first 15 characters from database');
      return cached;
    }

    console.log('Cache miss - Fetching first 15 characters from database');
    const characters = await this.repository.findFirst15();

    await this.cache.set(cacheKey, characters, 1800);

    console.log(`Fetched first ${characters.length} characters from database`);
    return characters;
  }

  async getCharacterCount(filters?: CharacterFilters): Promise<number> {
    return await this.repository.count(filters);
  }

  /**
   * Convierte un modelo Character a formato GraphQL
   */
  formatForGraphQL(character: Character): any {
    const getDateString = (dateValue: any) => {
      if (!dateValue) return new Date().toISOString();

      if (typeof dateValue === 'string') return dateValue;
      if (dateValue instanceof Date) return dateValue.toISOString();

      return new Date().toISOString();
    };

    return {
      id: character.id,
      name: character.name,
      status: character.status,
      species: character.species,
      type: character.type || '',
      gender: character.gender,
      origin: {
        name: character.Origin?.name || 'unknown',
        url: character.Origin?.url || ''
      },
      location: {
        name: character.Location?.name || 'unknown',
        url: character.Location?.url || ''
      },
      image: character.image || '',
      episode: character.Episodes?.map(ep => ep.url) || [],
      url: character.url || '',
      created: getDateString(character.apiCreated || character.createdAt)
    };
  }
}