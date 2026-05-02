import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export type DesignArtifactDocument = DesignArtifact & Document;

@Schema({ timestamps: true })
export class DesignArtifact {
  @Prop({ required: true }) titulo: string;
  @Prop({ required: true, enum: ['mockup', 'wireframe', 'prototipo', 'design-system', 'guia-estilos', 'componente', 'handoff'] }) tipo: string;
  @Prop() descripcion: string;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop() figmaUrl: string;
  @Prop() previewUrl: string;
  @Prop({ type: [String] }) colores: string[];
  @Prop({ type: [String] }) tipografias: string[];
  @Prop({ type: [String] }) componentes: string[];
  @Prop({ enum: ['borrador','revision','aprobado','en-handoff'], default: 'borrador' }) estado: string;
  @Prop() version: string;
  @Prop({ type: Types.ObjectId, ref: 'BacklogItem' }) historiaRelacionada: Types.ObjectId;
  @Prop({ type: [{ comentario: String, usuario: Types.ObjectId, fecha: Date }] }) comentarios: any[];
}
export const DesignArtifactSchema = SchemaFactory.createForClass(DesignArtifact);

export class CreateDesignArtifactDto {
  @ApiProperty({ example: 'Mockup - Pantalla Login' }) @IsString() titulo: string;
  @ApiProperty({ example: 'mockup', description: 'mockup | wireframe | prototipo | design-system | guia-estilos | componente | handoff' }) @IsString() tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional({ example: 'https://www.figma.com/file/...' }) @IsOptional() @IsString() figmaUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() previewUrl?: string;
  @ApiPropertyOptional({ type: [String], example: ['#1A73E8', '#FFFFFF'] }) @IsOptional() @IsArray() colores?: string[];
  @ApiPropertyOptional({ type: [String], example: ['Inter', 'Roboto'] }) @IsOptional() @IsArray() tipografias?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() componentes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() version?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() historiaRelacionada?: string;
}
export class UpdateDesignArtifactDto extends PartialType(CreateDesignArtifactDto) {
  @ApiPropertyOptional({ enum: ['borrador','revision','aprobado','en-handoff'] }) @IsOptional() @IsString() estado?: string;
}

@Injectable()
export class DesignService {
  constructor(@InjectModel(DesignArtifact.name) private model: Model<DesignArtifactDocument>) {}
  create(dto: CreateDesignArtifactDto) { return new this.model(dto).save(); }
  findAll(proyectoId?: string) {
    const f = proyectoId ? { proyecto: proyectoId } : {};
    return this.model.find(f).populate('proyecto', 'nombre').exec();
  }
  async findOne(id: string) {
    const r = await this.model.findById(id).populate('proyecto historiaRelacionada');
    if (!r) throw new NotFoundException('Artefacto de diseño no encontrado');
    return r;
  }
  async update(id: string, dto: UpdateDesignArtifactDto) {
    const r = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Artefacto de diseño no encontrado');
    return r;
  }
  async remove(id: string) {
    const r = await this.model.findByIdAndDelete(id);
    if (!r) throw new NotFoundException('Artefacto de diseño no encontrado');
    return { message: 'Artefacto eliminado' };
  }
}

@ApiTags('Design')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('design')
export class DesignController {
  constructor(private readonly svc: DesignService) {}
  @Post() @ApiOperation({ summary: '[UI] Registrar mockup / diseño / design system' }) create(@Body() dto: CreateDesignArtifactDto) { return this.svc.create(dto); }
  @Get() @ApiOperation({ summary: '[UI] Listar artefactos de diseño' }) findAll() { return this.svc.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Obtener artefacto de diseño' }) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: '[UI] Actualizar diseño' }) update(@Param('id') id: string, @Body() dto: UpdateDesignArtifactDto) { return this.svc.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: '[UI] Eliminar artefacto' }) remove(@Param('id') id: string) { return this.svc.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: DesignArtifact.name, schema: DesignArtifactSchema }])],
  controllers: [DesignController],
  providers: [DesignService],
})
export class DesignModule {}
