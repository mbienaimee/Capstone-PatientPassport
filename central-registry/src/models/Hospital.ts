import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface HospitalAttributes {
  id: number;
  hospitalId: string;
  hospitalName: string;
  fhirEndpoint: string;
  apiKey: string;
  isActive: boolean;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HospitalCreationAttributes extends Optional<HospitalAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Hospital extends Model<HospitalAttributes, HospitalCreationAttributes> implements HospitalAttributes {
  public id!: number;
  public hospitalId!: string;
  public hospitalName!: string;
  public fhirEndpoint!: string;
  public apiKey!: string;
  public isActive!: boolean;
  public lastSync!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Hospital.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    hospitalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fhirEndpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Hospital',
    tableName: 'hospitals',
    indexes: [
      {
        unique: true,
        fields: ['hospitalId'],
        name: 'unique_hospital_id',
      },
    ],
  }
);

