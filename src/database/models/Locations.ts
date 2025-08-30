import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/db-simple';

interface LocationAttributes {
  id: number;
  name: string;
  url?: string;
  type?: string;
  dimension?: string;
  residents?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface LocationCreationAttributes extends Optional<LocationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
  public id!: number;
  public name!: string;
  public url?: string;
  public type?: string;
  public dimension?: string;
  public residents?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly Characters?: any[];
}

Location.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dimension: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  residents: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
}, {
  sequelize,
  tableName: 'locations',
  modelName: 'Location',
  underscored: true,
  timestamps: true,
});

export default Location;