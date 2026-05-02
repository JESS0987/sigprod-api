import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Test Case Schema
export type TestCaseDocument = TestCase & Document;
@Schema({ timestamps: true })
export class TestCase {
  @Prop({ required: true }) codigo: string;
  @Prop({ required: true }) titulo: string;
  @Prop() descripcion: string;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'BacklogItem' }) historiaRelacionada: Types.ObjectId;
  @Prop({ enum: ['unitaria','integracion','sistema','aceptacion','regresion','rendimiento'], default: 'sistema' }) tipoPrueba: string;
  @Prop({ enum: ['manual','automatizada'], default: 'manual' }) modalidad: string;
  @Prop() precondiciones: string;
  @Prop({ type: [String] }) pasos: string[];
  @Prop() resultadoEsperado: string;
  @Prop() resultadoObtenido: string;
  @Prop({ enum: ['pendiente','aprobado','fallido','bloqueado'], default: 'pendiente' }) resultado: string;
  @Prop({ enum: ['critica','alta','media','baja'], default: 'media' }) prioridad: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) asignado: Types.ObjectId;
}
export const TestCaseSchema = SchemaFactory.createForClass(TestCase);

// Defect Schema
export type DefectDocument = Defect & Document;
@Schema({ timestamps: true })
export class Defect {
  @Prop({ required: true }) codigo: string;
  @Prop({ required: true }) titulo: string;
  @Prop() descripcion: string;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Sprint' }) sprint: Types.ObjectId;
  @Prop({ enum: ['critico','alto','medio','bajo'], default: 'medio' }) severidad: string;
  @Prop({ enum: ['abierto','en-progreso','resuelto','cerrado','rechazado'], default: 'abierto' }) estado: string;
  @Prop() pasosReproduccion: string;
  @Prop() resultadoEsperado: string;
  @Prop() resultadoActual: string;
  @Prop() ambiente: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) asignado: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'TestCase' }) casoPrueba: Types.ObjectId;
  @Prop({ type: [String] }) evidencias: string[];
}
export const DefectSchema = SchemaFactory.createForClass(Defect);

// DTOs
export class CreateTestCaseDto {
  @ApiProperty({ example: 'TC-001' }) @IsString() codigo: string;
  @ApiProperty({ example: 'Verificar inicio de sesión exitoso' }) @IsString() titulo: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional({ enum: ['unitaria','integracion','sistema','aceptacion','regresion','rendimiento'] }) @IsOptional() @IsString() tipoPrueba?: string;
  @ApiPropertyOptional({ enum: ['manual','automatizada'] }) @IsOptional() @IsString() modalidad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() precondiciones?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() pasos?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() resultadoEsperado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() historiaRelacionada?: string;
}
export class UpdateTestCaseDto extends PartialType(CreateTestCaseDto) {
  @ApiPropertyOptional({ enum: ['pendiente','aprobado','fallido','bloqueado'] }) @IsOptional() @IsString() resultado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resultadoObtenido?: string;
}

export class CreateDefectDto {
  @ApiProperty({ example: 'BUG-001' }) @IsString() codigo: string;
  @ApiProperty({ example: 'El botón de login no responde en móvil' }) @IsString() titulo: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional({ enum: ['critico','alto','medio','bajo'] }) @IsOptional() @IsString() severidad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pasosReproduccion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resultadoEsperado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resultadoActual?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ambiente?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() asignado?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() evidencias?: string[];
}
export class UpdateDefectDto extends PartialType(CreateDefectDto) {
  @ApiPropertyOptional({ enum: ['abierto','en-progreso','resuelto','cerrado','rechazado'] }) @IsOptional() @IsString() estado?: string;
}

// Service
@Injectable()
export class QaService {
  constructor(
    @InjectModel(TestCase.name) private tcModel: Model<TestCaseDocument>,
    @InjectModel(Defect.name) private defModel: Model<DefectDocument>,
  ) {}
  createTestCase(dto: CreateTestCaseDto) { return new this.tcModel(dto).save(); }
  findAllTestCases(proyectoId?: string) { return this.tcModel.find(proyectoId ? { proyecto: proyectoId } : {}).populate('asignado', '-password').exec(); }
  async findOneTestCase(id: string) {
    const r = await this.tcModel.findById(id).populate('proyecto asignado historiaRelacionada');
    if (!r) throw new NotFoundException('Caso de prueba no encontrado');
    return r;
  }
  async updateTestCase(id: string, dto: UpdateTestCaseDto) {
    const r = await this.tcModel.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Caso de prueba no encontrado');
    return r;
  }
  async removeTestCase(id: string) { await this.tcModel.findByIdAndDelete(id); return { message: 'Caso de prueba eliminado' }; }
  
  createDefect(dto: CreateDefectDto) { return new this.defModel(dto).save(); }
  findAllDefects(proyectoId?: string) { return this.defModel.find(proyectoId ? { proyecto: proyectoId } : {}).populate('asignado', '-password').exec(); }
  async findOneDefect(id: string) {
    const r = await this.defModel.findById(id).populate('proyecto asignado sprint casoPrueba');
    if (!r) throw new NotFoundException('Defecto no encontrado');
    return r;
  }
  async updateDefect(id: string, dto: UpdateDefectDto) {
    const r = await this.defModel.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Defecto no encontrado');
    return r;
  }
  async removeDefect(id: string) { await this.defModel.findByIdAndDelete(id); return { message: 'Defecto eliminado' }; }

  async getQaReport(proyectoId: string) {
    const [total, aprobados, fallidos, defectos, criticos] = await Promise.all([
      this.tcModel.countDocuments({ proyecto: proyectoId }),
      this.tcModel.countDocuments({ proyecto: proyectoId, resultado: 'aprobado' }),
      this.tcModel.countDocuments({ proyecto: proyectoId, resultado: 'fallido' }),
      this.defModel.countDocuments({ proyecto: proyectoId }),
      this.defModel.countDocuments({ proyecto: proyectoId, severidad: 'critico', estado: { $ne: 'cerrado' } }),
    ]);
    return {
      proyecto: proyectoId,
      casosPrueba: { total, aprobados, fallidos, pendientes: total - aprobados - fallidos },
      cobertura: total > 0 ? Math.round((aprobados / total) * 100) : 0,
      defectos: { total: defectos, criticos },
      generado: new Date().toISOString(),
    };
  }
}

// Controller
@ApiTags('QA')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('qa')
export class QaController {
  constructor(private readonly svc: QaService) {}
  @Post('test-cases') @ApiOperation({ summary: '[QA] Crear caso de prueba' }) createTC(@Body() dto: CreateTestCaseDto) { return this.svc.createTestCase(dto); }
  @Get('test-cases') @ApiOperation({ summary: '[QA] Listar casos de prueba' }) findAllTC() { return this.svc.findAllTestCases(); }
  @Get('test-cases/:id') @ApiOperation({ summary: '[QA] Obtener caso de prueba' }) findOneTC(@Param('id') id: string) { return this.svc.findOneTestCase(id); }
  @Patch('test-cases/:id') @ApiOperation({ summary: '[QA] Actualizar / ejecutar caso de prueba' }) updateTC(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) { return this.svc.updateTestCase(id, dto); }
  @Delete('test-cases/:id') @ApiOperation({ summary: '[QA] Eliminar caso de prueba' }) removeTC(@Param('id') id: string) { return this.svc.removeTestCase(id); }
  @Post('defects') @ApiOperation({ summary: '[QA] Reportar defecto / bug' }) createDef(@Body() dto: CreateDefectDto) { return this.svc.createDefect(dto); }
  @Get('defects') @ApiOperation({ summary: '[QA] Listar defectos' }) findAllDef() { return this.svc.findAllDefects(); }
  @Get('defects/:id') @ApiOperation({ summary: '[QA] Obtener defecto' }) findOneDef(@Param('id') id: string) { return this.svc.findOneDefect(id); }
  @Patch('defects/:id') @ApiOperation({ summary: '[QA] Actualizar estado del defecto' }) updateDef(@Param('id') id: string, @Body() dto: UpdateDefectDto) { return this.svc.updateDefect(id, dto); }
  @Delete('defects/:id') @ApiOperation({ summary: '[QA] Eliminar defecto' }) removeDef(@Param('id') id: string) { return this.svc.removeDefect(id); }
  @Get('report/:proyectoId') @ApiOperation({ summary: '[QA] Reporte de calidad del proyecto' }) report(@Param('proyectoId') id: string) { return this.svc.getQaReport(id); }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestCase.name, schema: TestCaseSchema },
      { name: Defect.name, schema: DefectSchema },
    ]),
  ],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}
