import { Character } from '../database/models/Character';
import { Origin } from '../database/models/Origin';
import { Location } from '../database/models/Locations';
import { Episode } from '../database/models/Episode';
import { Op } from 'sequelize';

export interface CharacterFilters {
  name?: string;
  status?: string;
  species?: string;
  gender?: string;
  origin?: string;
}

export class CharacterRepository {

  async findAll(filters?: CharacterFilters): Promise<Character[]> {
    const whereClause: any = {};

    // Aplicar filtros
    if (filters?.name) {
      whereClause.name = { [Op.iLike]: `%${filters.name}%` };
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.species) {
      whereClause.species = { [Op.iLike]: `%${filters.species}%` };
    }

    if (filters?.gender) {
      whereClause.gender = filters.gender;
    }

    const includeClause: any[] = [
      {
        model: Origin,
        as: 'Origin',
        required: false
      },
      {
        model: Location,
        as: 'Location',
        required: false
      },
      {
        model: Episode,
        as: 'Episodes',
        required: false,
        through: { attributes: [] } // Excluir atributos de la tabla pivote
      }
    ];

    // Filtro por origin name
    if (filters?.origin) {
      includeClause[0].where = {
        name: { [Op.iLike]: `%${filters.origin}%` }
      };
      includeClause[0].required = true;
    }

    return await Character.findAll({
      where: whereClause,
      include: includeClause,
      order: [['id', 'ASC']]
    });
  }

  async findById(id: number): Promise<Character | null> {
    return await Character.findByPk(id, {
      include: [
        {
          model: Origin,
          as: 'Origin',
          required: false
        },
        {
          model: Location,
          as: 'Location',
          required: false
        },
        {
          model: Episode,
          as: 'Episodes',
          required: false,
          through: { attributes: [] }
        }
      ]
    });
  }

  async findByExternalId(externalId: number): Promise<Character | null> {
    return await Character.findOne({
      where: { externalId },
      include: [
        {
          model: Origin,
          as: 'Origin',
          required: false
        },
        {
          model: Location,
          as: 'Location',
          required: false
        },
        {
          model: Episode,
          as: 'Episodes',
          required: false,
          through: { attributes: [] }
        }
      ]
    });
  }

  async count(filters?: CharacterFilters): Promise<number> {
    const whereClause: any = {};

    if (filters?.name) {
      whereClause.name = { [Op.iLike]: `%${filters.name}%` };
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.species) {
      whereClause.species = { [Op.iLike]: `%${filters.species}%` };
    }

    if (filters?.gender) {
      whereClause.gender = filters.gender;
    }

    const includeClause: any[] = [];

    if (filters?.origin) {
      includeClause.push({
        model: Origin,
        as: 'Origin',
        where: {
          name: { [Op.iLike]: `%${filters.origin}%` }
        },
        required: true
      });
    }

    return await Character.count({
      where: whereClause,
      include: includeClause.length > 0 ? includeClause : undefined,
      distinct: true
    });
  }

  async findFirst15(): Promise<Character[]> {
    return await Character.findAll({
      limit: 15,
      include: [
        {
          model: Origin,
          as: 'Origin',
          required: false
        },
        {
          model: Location,
          as: 'Location',
          required: false
        },
        {
          model: Episode,
          as: 'Episodes',
          required: false,
          through: { attributes: [] }
        }
      ],
      order: [['id', 'ASC']]
    });
  }
}