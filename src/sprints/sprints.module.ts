import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export enum SprintStatus { PLANIFICADO = 'planificado', ACTIVO = 'activo', COMPLETADO = 'completado', CANCELADO = 'cancelado' }
export type SprintDocument = Sprint & Document;

@Schema({ timestamps: true })
export class Sprint {
  @Prop({ required: true }) nombre: string;
  @Prop({ required: true }) numero: number;
  @Prop({ type: String, enum: SprintStatus, default: SprintStatus.PLANIFICADO }) estado: SprintStatus;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop({ required: true }) fechaInicio: Date;
  @Prop({ required: true }) fechaFin: Date;
  @Prop() objetivo: string;
  @Prop({ default: 0 }) velocidad: number;
  @Prop({ default: 0 }) capacidad: number;
  @Prop({ type: [{ tipo: String, descripcion: String, nivel: String, mitigacion: String }] }) riesgos: any[];
  @Prop({ type: [{ fecha: Date, asistentes: [Types.ObjectId], notas: String, impedimentos: String }] }) dailyStandups: any[];
  @Prop() retrospectiva: string;
}
export const SprintSchema = SchemaFactory.createForClass(Sprint);

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 1 - Autenticación' }) @IsString() nombre: string;
  @ApiProperty({ example: 1 }) @IsNumber() numero: number;
  @ApiProperty({ example: '2024-01-15' }) @IsDateString() fechaInicio: string;
  @ApiProperty({ example: '2024-01-29' }) @IsDateString() fechaFin: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional() @IsOptional() @IsString() objetivo?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() velocidad?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacidad?: number;
}
export class UpdateSprintDto extends PartialType(CreateSprintDto) {
  @ApiPropertyOptional({ enum: SprintStatus }) @IsOptional() @IsEnum(SprintStatus) estado?: SprintStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() retrospectiva?: string;
}

@Injectable()
export class SprintsService {
  constructor(@InjectModel(Sprint.name) private model: Model<SprintDocument>) {}
  create(dto: CreateSprintDto) { return new this.model(dto).save(); }
  findAll(proyectoId?: string) {
    const filter = proyectoId ? { proyecto: proyectoId } : {};
    return this.model.find(filter).populate('proyecto', 'nombre estado').exec();
  }
  async findOne(id: string) {
    const s = await this.model.findById(id).populate('proyecto');
    if (!s) throw new NotFoundException('Sprint no encontrado');
    return s;
  }
  async update(id: string, dto: UpdateSprintDto) {
    const s = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!s) throw new NotFoundException('Sprint no encontrado');
    return s;
  }
  async remove(id: string) {
    const s = await this.model.findByIdAndDelete(id);
    if (!s) throw new NotFoundException('Sprint no encontrado');
    return { message: 'Sprint eliminado' };
  }
  async addRiesgo(id: string, riesgo: any) {
    return this.model.findByIdAndUpdate(id, { $push: { riesgos: riesgo } }, { new: true });
  }
  async addDailyStandup(id: string, standup: any) {
    return this.model.findByIdAndUpdate(id, { $push: { dailyStandups: standup } }, { new: true });
  }
}

@ApiTags('Sprints')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('sprints')
export class SprintsController {
  constructor(private readonly svc: SprintsService) {}
  @Post() @ApiOperation({ summary: '[SM] Crear sprint' }) create(@Body() dto: CreateSprintDto) { return this.svc.create(dto); }
  @Get() @ApiOperation({ summary: 'Listar sprints (filtrar por proyectoId query param)' }) findAll() { return this.svc.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Obtener sprint por ID' }) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: '[SM] Actualizar sprint' }) update(@Param('id') id: string, @Body() dto: UpdateSprintDto) { return this.svc.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: '[SM] Eliminar sprint' }) remove(@Param('id') id: string) { return this.svc.remove(id); }
  @Post(':id/riesgos') @ApiOperation({ summary: '[SM] Agregar riesgo al sprint' }) addRiesgo(@Param('id') id: string, @Body() riesgo: any) { return this.svc.addRiesgo(id, riesgo); }
  @Post(':id/standups') @ApiOperation({ summary: '[SM] Registrar daily standup' }) addStandup(@Param('id') id: string, @Body() standup: any) { return this.svc.addDailyStandup(id, standup); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Sprint.name, schema: SprintSchema }])],
  controllers: [SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
