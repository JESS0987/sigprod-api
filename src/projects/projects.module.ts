import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsDateString } from 'class-validator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
export enum ProjectStatus { ACTIVO = 'activo', PAUSADO = 'pausado', COMPLETADO = 'completado', CANCELADO = 'cancelado' }
export enum Methodology { SCRUM = 'Scrum', KANBAN = 'Kanban', SCRUMBAN = 'Scrumban' }

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true }) nombre: string;
  @Prop() descripcion: string;
  @Prop({ type: String, enum: ProjectStatus, default: ProjectStatus.ACTIVO }) estado: ProjectStatus;
  @Prop({ type: String, enum: Methodology, default: Methodology.SCRUM }) metodologia: Methodology;
  @Prop() sector: string;
  @Prop() cliente: string;
  @Prop() fechaInicio: Date;
  @Prop() fechaFin: Date;
  @Prop({ type: [Types.ObjectId], ref: 'User' }) equipo: Types.ObjectId[];
  @Prop({ type: Types.ObjectId, ref: 'User' }) productOwner: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) scrumMaster: Types.ObjectId;
  @Prop() repositorioUrl: string;
  @Prop({ default: 0 }) progreso: number;
}
export const ProjectSchema = SchemaFactory.createForClass(Project);

// ─── DTOS ─────────────────────────────────────────────────────────────────────
export class CreateProjectDto {
  @ApiProperty({ example: 'Portal Bancario Digital' }) @IsString() nombre: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.ACTIVO }) @IsEnum(ProjectStatus) estado: ProjectStatus;
  @ApiProperty({ enum: Methodology, default: Methodology.SCRUM }) @IsEnum(Methodology) metodologia: Methodology;
  @ApiPropertyOptional({ example: 'Financiero' }) @IsOptional() @IsString() sector?: string;
  @ApiPropertyOptional({ example: 'Bancolombia' }) @IsOptional() @IsString() cliente?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaInicio?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaFin?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() equipo?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() productOwner?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scrumMaster?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() repositorioUrl?: string;
}
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

// ─── SERVICE ──────────────────────────────────────────────────────────────────
@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private model: Model<ProjectDocument>) {}
  create(dto: CreateProjectDto) { return new this.model(dto).save(); }
  findAll() { return this.model.find().populate('equipo', '-password').populate('productOwner', '-password').populate('scrumMaster', '-password').exec(); }
  async findOne(id: string) {
    const p = await this.model.findById(id).populate('equipo', '-password').populate('productOwner', '-password').populate('scrumMaster', '-password');
    if (!p) throw new NotFoundException('Proyecto no encontrado');
    return p;
  }
  async update(id: string, dto: UpdateProjectDto) {
    const p = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!p) throw new NotFoundException('Proyecto no encontrado');
    return p;
  }
  async remove(id: string) {
    const p = await this.model.findByIdAndDelete(id);
    if (!p) throw new NotFoundException('Proyecto no encontrado');
    return { message: 'Proyecto eliminado' };
  }
}

// ─── CONTROLLER ───────────────────────────────────────────────────────────────
@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}
  @Post() @ApiOperation({ summary: 'Crear proyecto' }) create(@Body() dto: CreateProjectDto) { return this.svc.create(dto); }
  @Get() @ApiOperation({ summary: 'Listar proyectos activos' }) findAll() { return this.svc.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Obtener proyecto por ID' }) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: 'Actualizar proyecto' }) update(@Param('id') id: string, @Body() dto: UpdateProjectDto) { return this.svc.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Eliminar proyecto' }) remove(@Param('id') id: string) { return this.svc.remove(id); }
}

// ─── MODULE ───────────────────────────────────────────────────────────────────
@Module({
  imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
