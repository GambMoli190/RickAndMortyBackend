import Character from "./Character";
import Origin from "./Origin";
import Location from "./Locations";
import Episode from "./Episode";

// Define associations
const setupAssociations = () => {
  // Character belongs to Origin
  Character.belongsTo(Origin, {
    foreignKey: 'originId',
    as: 'Origin',
  });

  // Character belongs to Location
  Character.belongsTo(Location, {
    foreignKey: 'locationId',
    as: 'Location',
  });

  // Character belongs to many Episodes (many-to-many)
  Character.belongsToMany(Episode, {
    through: 'character_episodes',
    foreignKey: 'character_id',
    otherKey: 'episode_id',
    as: 'Episodes',
  });

  // Origin has many Characters
  Origin.hasMany(Character, {
    foreignKey: 'originId',
    as: 'Characters',
  });

  // Location has many Characters
  Location.hasMany(Character, {
    foreignKey: 'locationId',
    as: 'Characters',
  });

  // Episode belongs to many Characters (many-to-many)
  Episode.belongsToMany(Character, {
    through: 'character_episodes',
    foreignKey: 'episode_id',
    otherKey: 'character_id',
    as: 'Characters',
  });
};

// Initialize associations
setupAssociations();

// Export models
export {
  Character,
  Origin,
  Location,
  Episode,
  setupAssociations,
};

export default {
  Character,
  Origin,
  Location,
  Episode,
};