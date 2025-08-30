import * as cron from 'node-cron';
import { RickAndMortyService } from '../services/RickAndMortyService';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { Character } from '../database/models/Character';
import { Origin } from '../database/models/Origin';
import { Location } from '../database/models/Locations';
import { Episode } from '../database/models/Episode';
import { CacheService } from '../services/CacheService';

export class CharacterUpdateJob {
  private rickAndMortyService: RickAndMortyService;
  private characterRepository: CharacterRepository;
  private cache: CacheService;
  private readonly TOTAL_CHARACTERS_IN_API = 826; // Total de personajes en la API de Rick and Morty
  private readonly MAX_CHARACTERS_TO_KEEP = 15; // Máximo de personajes a mantener en la BD

  constructor() {
    this.rickAndMortyService = new RickAndMortyService();
    this.characterRepository = new CharacterRepository();
    this.cache = CacheService.getInstance();
  }

  /**
   * Elimina personajes extras para mantener solo 15
   */
  private async trimCharactersTo15(characters: Character[]): Promise<void> {
    const extraCharacters = characters.slice(this.MAX_CHARACTERS_TO_KEEP);
    console.log(`Removing ${extraCharacters.length} extra characters to keep only ${this.MAX_CHARACTERS_TO_KEEP}`);

    for (const character of extraCharacters) {
      try {
        await character.destroy();
        console.log(`✓ Deleted: ${character.name} (ID: ${character.externalId})`);
      } catch (error) {
        console.error(`✗ Failed to delete character ${character.name}:`, error);
      }
    }
  }

  start(): void {
    console.log('Starting character update cron job...');

    cron.schedule('0 */12 * * *', async () => {
      console.log('\n=== Character Update Started ===');
      console.log(`Timestamp: ${new Date().toISOString()}`);

      try {
        await this.updateCharactersWithNewOnes();
        console.log('=== Character Update Completed ===\n');
      } catch (error) {
        console.error('=== Character Update Failed ===');
        console.error('Error:', error);
        console.log('==============================\n');
      }
    });

    console.log('Character update cron job scheduled successfully');
  }

  async runNow(): Promise<void> {
    console.log('\n=== Manual Character Update Started ===');
    try {
      await this.updateCharactersWithNewOnes();
      console.log('=== Manual Character Update Completed ===\n');
    } catch (error) {
      console.error('=== Manual Character Update Failed ===');
      console.error('Error:', error);
      console.log('================================\n');
      throw error;
    }
  }

  /**
   * Actualiza los personajes existentes con personajes nuevos/diferentes de la API
   */
  private async updateCharactersWithNewOnes(): Promise<void> {
    console.log('Fetching existing characters from database...');

    // Obtener todos los personajes existentes en la BD
    const existingCharacters = await this.characterRepository.findAll();
    console.log(`Found ${existingCharacters.length} characters in database`);

    // Si hay más de 15 personajes, eliminar los extras
    if (existingCharacters.length > this.MAX_CHARACTERS_TO_KEEP) {
      await this.trimCharactersTo15(existingCharacters);
      // Volver a obtener los personajes después de la limpieza
      const trimmedCharacters = await this.characterRepository.findAll();
      console.log(`After cleanup: ${trimmedCharacters.length} characters remaining`);
      return this.updateCharactersWithNewOnes(); // Recursión para continuar con los 15
    }

    if (existingCharacters.length === 0) {
      console.log('No characters found in database. Running seeder instead...');
      const { CharacterSeeder } = await import('../database/seeders/CharacterSeeder');
      const seeder = new CharacterSeeder();
      await seeder.seed();
      return;
    }

    // Limitar a máximo 15 personajes
    const charactersToUpdate = existingCharacters.slice(0, this.MAX_CHARACTERS_TO_KEEP);

    // Obtener los IDs externos actuales para saber cuáles ya tenemos
    const currentExternalIds = charactersToUpdate.map(char => char.externalId);
    console.log(`Current character IDs: ${currentExternalIds.join(', ')}`);

    // Generar nuevos IDs aleatorios que NO estén en la BD actual
    const newExternalIds = this.generateRandomNewIds(currentExternalIds, this.MAX_CHARACTERS_TO_KEEP);
    console.log(`New character IDs to fetch: ${newExternalIds.join(', ')}`);

    // Obtener los nuevos personajes de la API
    const newCharacters = await this.rickAndMortyService.getCharactersByIds(newExternalIds);
    console.log(`Fetched ${newCharacters.length} new characters from Rick and Morty API`);

    let updatedCount = 0;
    let errorsCount = 0;

    // Reemplazar cada personaje existente con uno nuevo
    for (let i = 0; i < Math.min(charactersToUpdate.length, newCharacters.length); i++) {
      const existingChar = charactersToUpdate[i];
      const newChar = newCharacters[i];

      if (!existingChar || !newChar) {
        console.warn(`Skipping replacement at index ${i}: missing character data`);
        continue;
      }

      try {
        await this.replaceCharacter(existingChar, newChar);
        updatedCount++;
        console.log(`✓ Replaced: ${existingChar.name} → ${newChar.name} (ID: ${existingChar.externalId} → ${newChar.id})`);
      } catch (error) {
        errorsCount++;
        console.error(`✗ Failed to replace character ${existingChar.name}:`, error);
      }
    }

    console.log(`\n--- Update Summary ---`);
    console.log(`Characters replaced: ${updatedCount}`);
    console.log(`Errors: ${errorsCount}`);

    // Limpiar cache después de actualizar
    await this.clearRelatedCache();
    console.log('Cache cleared after character update');
  }

  /**
   * Genera IDs aleatorios que no estén ya en la base de datos
   */
  private generateRandomNewIds(currentIds: number[], count: number): number[] {
    const availableIds = Array.from(
      { length: this.TOTAL_CHARACTERS_IN_API },
      (_, i) => i + 1
    ).filter(id => !currentIds.includes(id));

    // Mezclar los IDs disponibles aleatoriamente
    const shuffled = availableIds.sort(() => Math.random() - 0.5);

    // Tomar los primeros 'count' IDs
    return shuffled.slice(0, count);
  }

  /**
   * Reemplaza un personaje existente con los datos de un personaje nuevo
   */
  private async replaceCharacter(existingCharacter: Character, newApiCharacter: any): Promise<void> {
    // Procesar origin del nuevo personaje
    let originId = null;
    if (newApiCharacter.origin.name !== 'unknown') {
      const [origin] = await Origin.findOrCreate({
        where: { name: newApiCharacter.origin.name },
        defaults: {
          name: newApiCharacter.origin.name,
          url: newApiCharacter.origin.url,
        }
      });
      originId = origin.id;
    }

    // Procesar location del nuevo personaje
    let locationId = null;
    if (newApiCharacter.location.name !== 'unknown') {
      const [location] = await Location.findOrCreate({
        where: { name: newApiCharacter.location.name },
        defaults: {
          name: newApiCharacter.location.name,
          url: newApiCharacter.location.url,
        }
      });
      locationId = location.id;
    }

    // Reemplazar TODOS los datos del personaje existente con el nuevo
    await existingCharacter.update({
      externalId: newApiCharacter.id,
      name: newApiCharacter.name,
      status: newApiCharacter.status,
      species: newApiCharacter.species,
      type: newApiCharacter.type || '',
      gender: newApiCharacter.gender,
      originId: originId || undefined,
      locationId: locationId || undefined,
      image: newApiCharacter.image,
      url: newApiCharacter.url,
      apiCreated: new Date(newApiCharacter.created),
    });

    // Actualizar episodios con los del nuevo personaje
    if (newApiCharacter.episode && newApiCharacter.episode.length > 0) {
      await this.updateCharacterEpisodes(existingCharacter, newApiCharacter.episode.slice(0, 5));
    } else {
      // Si el nuevo personaje no tiene episodios, limpiar los episodios existentes
      await existingCharacter.setEpisodes([]);
    }
  }

  /**
   * Actualiza los episodios de un personaje
   */
  private async updateCharacterEpisodes(character: Character, episodeUrls: string[]): Promise<void> {
    const episodes: Episode[] = [];

    for (const episodeUrl of episodeUrls) {
      try {
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

    // Reemplazar todos los episodios (no agregar)
    await character.setEpisodes(episodes);
  }

  /**
   * Método para forzar el reemplazo de todos los personajes (útil para testing)
   */
  async replaceAllCharacters(): Promise<void> {
    console.log('\n=== REPLACING ALL CHARACTERS ===');
    await this.updateCharactersWithNewOnes();
  }

  /**
   * Método para reemplazar personajes con un rango específico de IDs
   */
  async replaceWithSpecificRange(startId: number, endId: number): Promise<void> {
    console.log(`\n=== REPLACING CHARACTERS WITH RANGE ${startId}-${endId} ===`);

    const existingCharacters = await this.characterRepository.findAll();
    if (existingCharacters.length === 0) {
      console.log('No characters found in database');
      return;
    }

    const targetIds = Array.from(
      { length: Math.min(endId - startId + 1, existingCharacters.length) },
      (_, i) => startId + i
    );

    console.log(`Fetching characters with IDs: ${targetIds.join(', ')}`);
    const newCharacters = await this.rickAndMortyService.getCharactersByIds(targetIds);

    let updatedCount = 0;
    for (let i = 0; i < Math.min(existingCharacters.length, newCharacters.length); i++) {
      const existingChar = existingCharacters[i];
      const newChar = newCharacters[i];

      if (!existingChar || !newChar) {
        console.warn(`Skipping replacement at index ${i}: missing character data`);
        continue;
      }

      try {
        await this.replaceCharacter(existingChar, newChar);
        updatedCount++;
        console.log(`✓ Replaced: ${existingChar.name} → ${newChar.name}`);
      } catch (error) {
        console.error(`✗ Failed to replace character:`, error);
      }
    }

    console.log(`Successfully replaced ${updatedCount} characters`);
    await this.clearRelatedCache();
  }

  /**
   * Limpia el cache relacionado con personajes
   */
  private async clearRelatedCache(): Promise<void> {
    try {
      if (this.cache.isAvailable()) {
        await this.cache.flush();
      }
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }
}