import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { CharacterService } from '../services/CharacterService';

const schema = buildSchema(`
  type Character {
    id: Int!
    name: String!
    status: String!
    species: String!
    type: String
    gender: String!
    origin: Origin!
    location: Location!
    image: String!
    episode: [String!]!
    url: String!
    created: String!
  }

  type Origin {
    name: String!
    url: String!
  }

  type Location {
    name: String!
    url: String!
  }

  input CharacterFilters {
    name: String
    status: String
    species: String
    gender: String
    origin: String
  }

  type Query {
    hello: String!
    status: String!
    characters(filters: CharacterFilters): [Character!]!
    character(id: Int!): Character
    first15Characters: [Character!]!
    characterCount(filters: CharacterFilters): Int!
  }
`);

const resolvers = {
  hello: () => 'Hello from Rick and Morty API!',
  status: () => 'Server running WITH database and Redis cache',

  characters: async (args: { filters?: any }) => {
    try {
      const service = new CharacterService();
      const characters = await service.getAllCharacters(args.filters);
      return characters.map(char => service.formatForGraphQL(char));
    } catch (error) {
      console.error('Error in characters resolver:', error);
      return [];
    }
  },

  character: async (args: { id: number }) => {
    try {
      const service = new CharacterService();
      const character = await service.getCharacterById(args.id);
      return character ? service.formatForGraphQL(character) : null;
    } catch (error) {
      console.error('Error in character resolver:', error);
      return null;
    }
  },

  first15Characters: async () => {
    try {
      const service = new CharacterService();
      const characters = await service.getFirst15Characters();
      return characters.map(char => service.formatForGraphQL(char));
    } catch (error) {
      console.error('Error in first15Characters resolver:', error);
      return [];
    }
  },

  characterCount: async (args: { filters?: any }) => {
    try {
      const service = new CharacterService();
      return await service.getCharacterCount(args.filters);
    } catch (error) {
      console.error('Error in characterCount resolver:', error);
      return 0;
    }
  }
};

export const graphqlHandler = createHandler({
  schema,
  rootValue: resolvers,
});