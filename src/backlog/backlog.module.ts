import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export enum BacklogItemStatus { PENDIENTE = 'pendiente', EN_PROGRESO = 'en_progreso', COMPLETADO = 'completado', CANCELADO = 'cancelado' }
export enum BacklogItemPriority { CRITICA = 'critica', ALTA = 'alta', MEDIA = 'media', BAJA = 'baja' }
export enum BacklogItemType { HISTORIA = 'historia_usuario', EPIC = 'epica', TAREA = 'tarea', BUG = 'bug', MEJORA = 'mejora' }
export type BacklogItemDocument = BacklogItem & Document;

@Schema({ timestamps: true })
export class BacklogItem {
  @Prop({ required: true }) titulo: string;
  @Prop() descripcion: string;
  @Prop({ type: String, enum: BacklogItemType, default: BacklogItemType.HISTORIA }) tipo: BacklogItemType;
  @Prop({ type: String, enum: BacklogItemPriority, default: BacklogItemPriority.MEDIA }) prioridad: BacklogItemPriority;
  @Prop({ type: String, enum: BacklogItemStatus, default: BacklogItemStatus.PENDIENTE }) estado: BacklogItemStatus;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Sprint' }) sprint: Types.ObjectId;
  @Prop({ default: 0 }) puntoHistoria: number;
  @Prop() criteriosAceptacion: string;
  @Prop({ type: [String] }) etiquetas: string[];
  @Prop({ type: Types.ObjectId, ref: 'User' }) asignado: Types.ObjectId;
  @Prop({ default: 0 }) orden: number;
  @Prop() comoRol: string;
  @Prop() quiero: string;
  @Prop() paraPoder: string;
}
export const BacklogItemSchema = SchemaFactory.createForClass(BacklogItem);

export class CreateBacklogItemDto {
  @ApiProperty({ example: 'Como usuario quiero iniciar sesión con email y contraseña' }) @IsString() titulo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ enum: BacklogItemType, default: BacklogItemType.HISTORIA }) @IsEnum(BacklogItemType) tipo: BacklogItemType;
  @ApiProperty({ enum: BacklogItemPriority, default: BacklogItemPriority.ALTA }) @IsEnum(BacklogItemPriority) prioridad: BacklogItemPriority;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional({ description: 'ID del sprint (si ya está asignado)' }) @IsOptional() @IsString() sprint?: string;
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @IsNumber() puntoHistoria?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() criteriosAceptacion?: string;
  @ApiPropertyOptional({ example: 'usuario registrado' }) @IsOptional() @IsString() comoRol?: string;
  @ApiPropertyOptional({ example: 'poder iniciar sesión con mis credenciales' }) @IsOptional() @IsString() quiero?: string;
  @ApiPropertyOptional({ example: 'acceder a las funcionalidades del sistema' }) @IsOptional() @IsString() paraPoder?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() etiquetas?: string[];
}
export class UpdateBacklogItemDto extends PartialType(CreateBacklogItemDto) {
  @ApiPropertyOptional({ enum: BacklogItemStatus }) @IsOptional() @IsEnum(BacklogItemStatus) estado?: BacklogItemStatus;
}

@Injectable()
export class BacklogService {
  constructor(@InjectModel(BacklogItem.name) private model: Model<BacklogItemDocument>) {}
  create(dto: CreateBacklogItemDto) { return new this.model(dto).save(); }
  findAll(proyectoId?: string) {
    const filter = proyectoId ? { proyecto: proyectoId } : {};
    return this.model.find(filter).sort({ prioridad: 1, orden: 1 }).populate('sprint', 'nombre numero').populate('asignado', '-password').exec();
  }
  async findOne(id: string) {
    const item = await this.model.findById(id).populate('proyecto sprint asignado');
    if (!item) throw new NotFoundException('Item del backlog no encontrado');
    return item;
  }
  async update(id: string, dto: UpdateBacklogItemDto) {
    const item = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException('Item del backlog no encontrado');
    return item;
  }
  async remove(id: string) {
    const item = await this.model.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Item del backlog no encontrado');
    return { message: 'Item eliminado del backlog' };
  }
}

@ApiTags('Backlog')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('backlog')
export class BacklogController {
  constructor(private readonly svc: BacklogService) {}
  @Post() @ApiOperation({ summary: '[PO] Crear item en el backlog' }) create(@Body() dto: CreateBacklogItemDto) { return this.svc.create(dto); }
  @Get() @ApiOperation({ summary: '[PO] Listar product backlog (filtrar por proyectoId)' }) findAll() { return this.svc.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Obtener item del backlog' }) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: '[PO] Actualizar / priorizar item' }) update(@Param('id') id: string, @Body() dto: UpdateBacklogItemDto) { return this.svc.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: '[PO] Eliminar item del backlog' }) remove(@Param('id') id: string) { return this.svc.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: BacklogItem.name, schema: BacklogItemSchema }])],
  controllers: [BacklogController],
  providers: [BacklogService],
})
export class BacklogModule {}
