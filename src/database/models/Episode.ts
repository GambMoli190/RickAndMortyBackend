import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/db-simple';

interface EpisodeAttributes {
  id: number;
  name: string;
  airDate?: string;
  episode: string;
  url?: string;
  characters?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface EpisodeCreationAttributes extends Optional<EpisodeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Episode extends Model<EpisodeAttributes, EpisodeCreationAttributes> implements EpisodeAttributes {
  public id!: number;
  public name!: string;
  public airDate?: string;
  public episode!: string;
  public url?: string;
  public characters?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly Characters?: any[];
}

Episode.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  airDate: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'air_date',
  },
  episode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  characters: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
}, {
  sequelize,
  tableName: 'episodes',
  modelName: 'Episode',
  underscored: true,
  timestamps: true,
});

export default Episode;