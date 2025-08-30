import { DataTypes, Model, Optional, BelongsToManyGetAssociationsMixin, BelongsToManySetAssociationsMixin } from 'sequelize';
import { sequelize } from '../../config/db-simple';
import { Origin } from './Origin';
import { Location } from './Locations';
import { Episode } from './Episode';

type CharacterStatus = 'Alive' | 'Dead' | 'unknown';
type CharacterGender = 'Female' | 'Male' | 'Genderless' | 'unknown';

interface CharacterAttributes {
  id: number;
  externalId: number;
  name: string;
  status: CharacterStatus;
  species: string;
  type?: string;
  gender: CharacterGender;
  originId?: number;
  locationId?: number;
  image?: string;
  url?: string;
  apiCreated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CharacterCreationAttributes extends Optional<CharacterAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Character extends Model<CharacterAttributes, CharacterCreationAttributes> implements CharacterAttributes {
  public id!: number;
  public externalId!: number;
  public name!: string;
  public status!: CharacterStatus;
  public species!: string;
  public type?: string;
  public gender!: CharacterGender;
  public originId?: number;
  public locationId?: number;
  public image?: string;
  public url?: string;
  public apiCreated?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly Origin?: Origin;
  public readonly Location?: Location;
  public readonly Episodes?: Episode[];

  // Association methods
  public getEpisodes!: BelongsToManyGetAssociationsMixin<Episode>;
  public setEpisodes!: BelongsToManySetAssociationsMixin<Episode, number>; // AGREGAR ESTE
}

Character.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  externalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'external_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Alive', 'Dead', 'unknown'),
    allowNull: false,
  },
  species: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
  },
  gender: {
    type: DataTypes.ENUM('Female', 'Male', 'Genderless', 'unknown'),
    allowNull: false,
  },
  originId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'origin_id',
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'location_id',
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiCreated: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'api_created',
  },
}, {
  sequelize,
  tableName: 'characters',
  modelName: 'Character',
  underscored: true,
  timestamps: true,
});

export default Character;