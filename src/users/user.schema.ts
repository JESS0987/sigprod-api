import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PRODUCT_OWNER = 'PO',
  SCRUM_MASTER = 'SM',
  BUSINESS_ANALYST = 'BA',
  ARCHITECT = 'AR',
  UI_UX = 'UI',
  FRONTEND_DEV = 'FE',
  BACKEND_DEV = 'BE',
  QA_ENGINEER = 'QA',
  DEVOPS = 'DO',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.BACKEND_DEV })
  rol: UserRole;

  @Prop({ default: true })
  activo: boolean;

  @Prop()
  avatar?: string;

  @Prop()
  telefono?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
