import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export type ArchDecisionDocument = ArchDecision & Document;

@Schema({ timestamps: true })
export class ArchDecision {
  @Prop({ required: true }) titulo: string;
  @Prop({ required: true }) tipo: string; // ADR, modelo-bd, api-contract, estandar
  @Prop() descripcion: string;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop() contexto: string;
  @Prop() decision: string;
  @Prop() consecuencias: string;
  @Prop({ type: [String] }) alternativasConsideradas: string[];
  @Prop({ enum: ['propuesta', 'aceptada', 'deprecada', 'reemplazada'], default: 'propuesta' }) estado: string;
  @Prop() version: string;
  @Prop() diagramaUrl: string;
  @Prop() swaggerUrl: string;
  @Prop() coleccionPostmanUrl: string;
}
export const ArchDecisionSchema = SchemaFactory.createForClass(ArchDecision);

export class CreateArchDecisionDto {
  @ApiProperty({ example: 'Arquitectura de Microservicios vs Monolito' }) @IsString() titulo: string;
  @ApiProperty({ example: 'ADR', description: 'ADR | modelo-bd | api-contract | estandar | diagrama' }) @IsString() tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contexto?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decision?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() consecuencias?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() alternativasConsideradas?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() version?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() diagramaUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() swaggerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coleccionPostmanUrl?: string;
}
export class UpdateArchDecisionDto extends PartialType(CreateArchDecisionDto) {
  @ApiPropertyOptional({ enum: ['propuesta','aceptada','deprecada','reemplazada'] }) @IsOptional() @IsString() estado?: string;
}

@Injectable()
export class ArchitectureService {
  constructor(@InjectModel(ArchDecision.name) private model: Model<ArchDecisionDocument>) {}
  create(dto: CreateArchDecisionDto) { return new this.model(dto).save(); }
  findAll(proyectoId?: string) {
    const f = proyectoId ? { proyecto: proyectoId } : {};
    return this.model.find(f).populate('proyecto', 'nombre').exec();
  }
  async findOne(id: string) {
    const r = await this.model.findById(id).populate('proyecto');
    if (!r) throw new NotFoundException('Decisión de arquitectura no encontrada');
    return r;
  }
  async update(id: string, dto: UpdateArchDecisionDto) {
    const r = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Decisión de arquitectura no encontrada');
    return r;
  }
  async remove(id: string) {
    const r = await this.model.findByIdAndDelete(id);
    if (!r) throw new NotFoundException('Decisión de arquitectura no encontrada');
    return { message: 'Registro eliminado' };
  }
}

@ApiTags('Architecture')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('architecture')
export class ArchitectureController {
  constructor(private readonly svc: ArchitectureService) {}
  @Post() @ApiOperation({ summary: '[AR] Crear ADR / modelo de datos / contrato API' }) create(@Body() dto: CreateArchDecisionDto) { return this.svc.create(dto); }
  @Get() @ApiOperation({ summary: '[AR] Listar decisiones y artefactos de arquitectura' }) findAll() { return this.svc.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Obtener artefacto de arquitectura' }) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: '[AR] Actualizar decisión arquitectónica' }) update(@Param('id') id: string, @Body() dto: UpdateArchDecisionDto) { return this.svc.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: '[AR] Eliminar artefacto' }) remove(@Param('id') id: string) { return this.svc.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: ArchDecision.name, schema: ArchDecisionSchema }])],
  controllers: [ArchitectureController],
  providers: [ArchitectureService],
})
export class ArchitectureModule {}
