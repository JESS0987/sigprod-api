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

export enum ReqType { FUNCIONAL = 'funcional', NO_FUNCIONAL = 'no_funcional', CASO_USO = 'caso_uso', RESTRICCION = 'restriccion' }
export enum ReqStatus { BORRADOR = 'borrador', REVISADO = 'revisado', APROBADO = 'aprobado', RECHAZADO = 'rechazado' }
export type RequirementDocument = Requirement & Document;

@Schema({ timestamps: true })
export class Requirement {
  @Prop({ required: true }) codigo: string;
  @Prop({ required: true }) titulo: string;
  @Prop() descripcion: string;
  @Prop({ type: String, enum: ReqType, default: ReqType.FUNCIONAL }) tipo: ReqType;
  @Prop({ type: String, enum: ReqStatus, default: ReqStatus.BORRADOR }) estado: ReqStatus;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop() actor: string;
  @Prop() precondiciones: string;
  @Prop() flujoNormal: string;
  @Prop() flujoAlternativo: string;
  @Prop() postcondiciones: string;
  @Prop({ type: [String] }) dependencias: string[];
  @Prop() reglaNegocio: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) aprobadoPor: Types.ObjectId;
}
export const RequirementSchema = SchemaFactory.createForClass(Requirement);

export class CreateRequirementDto {
  @ApiProperty({ example: 'RF-001' }) @IsString() codigo: string;
  @ApiProperty({ example: 'Autenticación de usuarios' }) @IsString() titulo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ enum: ReqType, default: ReqType.FUNCIONAL }) @IsEnum(ReqType) tipo: ReqType;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional({ example: 'Usuario registrado' }) @IsOptional() @IsString() actor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() precondiciones?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() flujoNormal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() flujoAlternativo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postcondiciones?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reglaNegocio?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() dependencias?: string[];
}
export class UpdateRequirementDto extends PartialType(CreateRequirementDto) {
  @ApiPropertyOptional({ enum: ReqStatus }) @IsOptional() @IsEnum(ReqStatus) estado?: ReqStatus;
}

@Injectable()
export class RequirementsService {
  constructor(@InjectModel(Requirement.name) private model: Model<RequirementDocument>) {}
  create(dto: CreateRequirementDto) { return new this.model(dto).save(); }
  findAll(proyectoId?: string) {
    const f = proyectoId ? { proyecto: proyectoId } : {};
    return this.model.find(f).populate('proyecto', 'nombre').exec();
  }
  async findOne(id: string) {
    const r = await this.model.findById(id).populate('proyecto aprobadoPor');
    if (!r) throw new NotFoundException('Requisito no encontrado');
    return r;
  }
  async update(id: string, dto: UpdateRequirementDto) {
    const r = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Requisito no encontrado');
    return r;
  }
  async remove(id: string) {
    const r = await this.model.findByIdAndDelete(id);
    if (!r) throw new NotFoundException('Requisito no encontrado');
    return { message: 'Requisito eliminado' };
  }
}

@ApiTags('Requirements')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly svc: RequirementsService) {}
  @Post() @ApiOperation({ summary: '[BA] Crear requisito / caso de uso' }) create(@Body() dto: CreateRequirementDto) { return this.svc.create(dto); }
  @Get() @ApiOperation({ summary: '[BA] Listar requisitos (filtrar por proyectoId)' }) findAll() { return this.svc.findAll(); }
  @Get(':id') @ApiOperation({ summary: 'Obtener requisito por ID' }) findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch(':id') @ApiOperation({ summary: '[BA] Actualizar requisito' }) update(@Param('id') id: string, @Body() dto: UpdateRequirementDto) { return this.svc.update(id, dto); }
  @Delete(':id') @ApiOperation({ summary: '[BA] Eliminar requisito' }) remove(@Param('id') id: string) { return this.svc.remove(id); }
}

@Module({
  imports: [MongooseModule.forFeature([{ name: Requirement.name, schema: RequirementSchema }])],
  controllers: [RequirementsController],
  providers: [RequirementsService],
})
export class RequirementsModule {}
