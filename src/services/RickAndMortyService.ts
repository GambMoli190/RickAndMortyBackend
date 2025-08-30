import axios from 'axios';
import { config } from '../config/environment';
import { CacheService } from './CacheService';

export interface RickAndMortyCharacter {
  id: number;
  name: string;
  status: 'Alive' | 'Dead' | 'unknown';
  species: string;
  type: string;
  gender: 'Female' | 'Male' | 'Genderless' | 'unknown';
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface RickAndMortyApiResponse {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: RickAndMortyCharacter[];
}

export class RickAndMortyService {
  private baseUrl: string;
  private cache: CacheService;

  constructor() {
    this.baseUrl = config.rickAndMortyApiUrl;
    this.cache = CacheService.getInstance(); // Usar getInstance() en lugar de new
  }

  /**
   * Obtiene múltiples personajes por IDs
   */
  async getCharactersByIds(ids: number[]): Promise<RickAndMortyCharacter[]> {
    const cacheKey = this.cache.generateKey('characters_by_ids', ids);

    // Intentar obtener del cache
    const cached = await this.cache.get<RickAndMortyCharacter[]>(cacheKey);
    if (cached) {
      console.log(`Cache hit for characters by IDs: ${ids.join(',')}`);
      return cached;
    }

    try {
      const idsString = ids.join(',');
      const url = `${this.baseUrl}/character/${idsString}`;

      console.log(`Cache miss - Fetching characters from: ${url}`);

      const response = await axios.get<RickAndMortyCharacter | RickAndMortyCharacter[]>(url);

      // La API devuelve un array si hay múltiples IDs, o un objeto si hay solo uno
      const characters = Array.isArray(response.data) ? response.data : [response.data];

      // Guardar en cache
      await this.cache.set(cacheKey, characters);

      console.log(`Successfully fetched ${characters.length} characters`);
      return characters;

    } catch (error) {
      console.error('Error fetching characters by IDs:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Rick and Morty API error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Obtiene personajes con filtros
   */
  async getCharacters(filters?: {
    name?: string;
    status?: string;
    species?: string;
    gender?: string;
    page?: number;
  }): Promise<RickAndMortyApiResponse> {
    const cacheKey = this.cache.generateKey('characters_filtered', filters || {});

    // Intentar obtener del cache
    const cached = await this.cache.get<RickAndMortyApiResponse>(cacheKey);
    if (cached) {
      console.log('Cache hit for filtered characters');
      return cached;
    }

    try {
      const params = new URLSearchParams();

      if (filters?.name) params.append('name', filters.name);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.species) params.append('species', filters.species);
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.page) params.append('page', filters.page.toString());

      const url = `${this.baseUrl}/character?${params.toString()}`;
      console.log(`Cache miss - Fetching characters with filters: ${url}`);

      const response = await axios.get<RickAndMortyApiResponse>(url);

      // Guardar en cache
      await this.cache.set(cacheKey, response.data);

      console.log(`Successfully fetched ${response.data.results.length} characters`);
      return response.data;

    } catch (error) {
      console.error('Error fetching characters with filters:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Rick and Morty API error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Obtiene un personaje específico por ID
   */
  async getCharacterById(id: number): Promise<RickAndMortyCharacter> {
    const cacheKey = this.cache.generateKey('character_by_id', id);

    // Intentar obtener del cache
    const cached = await this.cache.get<RickAndMortyCharacter>(cacheKey);
    if (cached) {
      console.log(`Cache hit for character ID: ${id}`);
      return cached;
    }

    try {
      const url = `${this.baseUrl}/character/${id}`;
      console.log(`Cache miss - Fetching character: ${url}`);

      const response = await axios.get<RickAndMortyCharacter>(url);

      // Guardar en cache
      await this.cache.set(cacheKey, response.data);

      console.log(`Successfully fetched character: ${response.data.name}`);
      return response.data;

    } catch (error) {
      console.error(`Error fetching character ${id}:`, error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Rick and Morty API error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Obtiene los primeros 15 personajes para el seeder
   */
  async getFirst15Characters(): Promise<RickAndMortyCharacter[]> {
    try {
      const ids = Array.from({ length: 15 }, (_, i) => i + 1); // [1, 2, 3, ..., 15]
      return await this.getCharactersByIds(ids);
    } catch (error) {
      console.error('Error fetching first 15 characters:', error);
      throw error;
    }
  }
}