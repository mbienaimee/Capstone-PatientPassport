import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PatientRegistryAttributes {
  id: number;
  universalId: string;
  hospitalId: string;
  localPatientId: string;
  patientName: string;
  dateOfBirth: Date;
  gender: string;
  insuranceNumber?: string;
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientRegistryCreationAttributes extends Optional<PatientRegistryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PatientRegistry extends Model<PatientRegistryAttributes, PatientRegistryCreationAttributes> implements PatientRegistryAttributes {
  public id!: number;
  public universalId!: string;
  public hospitalId!: string;
  public localPatientId!: string;
  public patientName!: string;
  public dateOfBirth!: Date;
  public gender!: string;
  public insuranceNumber?: string;
  public isActive!: boolean;
  public lastUpdated!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PatientRegistry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    universalId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: false, // Not unique as same patient can be in multiple hospitals
    },
    hospitalId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    localPatientId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    patientName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('M', 'F', 'O'),
      allowNull: false,
    },
    insuranceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastUpdated: {
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
    modelName: 'PatientRegistry',
    tableName: 'patient_registry',
    indexes: [
      {
        unique: true,
        fields: ['universalId', 'hospitalId'],
        name: 'unique_patient_hospital',
      },
      {
        fields: ['universalId'],
        name: 'idx_universal_id',
      },
      {
        fields: ['hospitalId'],
        name: 'idx_hospital_id',
      },
      {
        fields: ['insuranceNumber'],
        name: 'idx_insurance_number',
      },
    ],
  }
);

