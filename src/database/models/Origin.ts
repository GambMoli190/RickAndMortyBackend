import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/db-simple';

interface OriginAttributes {
  id: number;
  name: string;
  url?: string;
  dimension?: string;
  residents?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface OriginCreationAttributes extends Optional<OriginAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Origin extends Model<OriginAttributes, OriginCreationAttributes> implements OriginAttributes {
  public id!: number;
  public name!: string;
  public url?: string;
  public dimension?: string;
  public residents?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly Characters?: any[];
}

Origin.init({
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
  tableName: 'origins',
  modelName: 'Origin',
  underscored: true,
  timestamps: true,
});

export default Origin;