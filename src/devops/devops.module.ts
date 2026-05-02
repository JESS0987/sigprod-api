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

// Pipeline Schema
export type PipelineDocument = Pipeline & Document;
@Schema({ timestamps: true })
export class Pipeline {
  @Prop({ required: true }) nombre: string;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop({ enum: ['github-actions','jenkins','gitlab-ci','bitbucket'], default: 'github-actions' }) herramienta: string;
  @Prop({ enum: ['dev','staging','production'], default: 'dev' }) ambiente: string;
  @Prop({ enum: ['activo','inactivo','fallido','ejecutando'], default: 'activo' }) estado: string;
  @Prop() repositorioUrl: string;
  @Prop() workflowFile: string;
  @Prop({ type: [{ ejecutadoEn: Date, resultado: String, duracion: Number, commitSha: String, rama: String, logs: String }] }) ejecuciones: any[];
  @Prop() dockerfileUrl: string;
  @Prop() imagenDocker: string;
  @Prop() urlDespliegue: string;
}
export const PipelineSchema = SchemaFactory.createForClass(Pipeline);

// Deployment Schema
export type DeploymentDocument = Deployment & Document;
@Schema({ timestamps: true })
export class Deployment {
  @Prop({ required: true }) version: string;
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true }) proyecto: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Pipeline' }) pipeline: Types.ObjectId;
  @Prop({ enum: ['dev','staging','production'] }) ambiente: string;
  @Prop({ enum: ['exitoso','fallido','en-progreso','revertido'], default: 'en-progreso' }) estado: string;
  @Prop() commitSha: string;
  @Prop() rama: string;
  @Prop() urlDesplegada: string;
  @Prop() notas: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) desplegadoPor: Types.ObjectId;
  @Prop() fechaDespliegue: Date;
}
export const DeploymentSchema = SchemaFactory.createForClass(Deployment);

// DTOs
export class CreatePipelineDto {
  @ApiProperty({ example: 'CI/CD - Portal Bancario' }) @IsString() nombre: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional({ enum: ['github-actions','jenkins','gitlab-ci','bitbucket'] }) @IsOptional() @IsString() herramienta?: string;
  @ApiPropertyOptional({ enum: ['dev','staging','production'] }) @IsOptional() @IsString() ambiente?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() repositorioUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() workflowFile?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dockerfileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imagenDocker?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() urlDespliegue?: string;
}
export class UpdatePipelineDto extends PartialType(CreatePipelineDto) {
  @ApiPropertyOptional({ enum: ['activo','inactivo','fallido','ejecutando'] }) @IsOptional() @IsString() estado?: string;
}

export class CreateDeploymentDto {
  @ApiProperty({ example: 'v1.2.3' }) @IsString() version: string;
  @ApiProperty({ description: 'ID del proyecto' }) @IsString() proyecto: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pipeline?: string;
  @ApiPropertyOptional({ enum: ['dev','staging','production'] }) @IsOptional() @IsString() ambiente?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() commitSha?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rama?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() urlDesplegada?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() desplegadoPor?: string;
}
export class UpdateDeploymentDto extends PartialType(CreateDeploymentDto) {
  @ApiPropertyOptional({ enum: ['exitoso','fallido','en-progreso','revertido'] }) @IsOptional() @IsString() estado?: string;
}

// Service
@Injectable()
export class DevopsService {
  constructor(
    @InjectModel(Pipeline.name) private pipeModel: Model<PipelineDocument>,
    @InjectModel(Deployment.name) private deplModel: Model<DeploymentDocument>,
  ) {}
  createPipeline(dto: CreatePipelineDto) { return new this.pipeModel(dto).save(); }
  findAllPipelines(proyectoId?: string) { return this.pipeModel.find(proyectoId ? { proyecto: proyectoId } : {}).populate('proyecto', 'nombre').exec(); }
  async findOnePipeline(id: string) {
    const r = await this.pipeModel.findById(id).populate('proyecto');
    if (!r) throw new NotFoundException('Pipeline no encontrado');
    return r;
  }
  async updatePipeline(id: string, dto: UpdatePipelineDto) {
    const r = await this.pipeModel.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Pipeline no encontrado');
    return r;
  }
  async addEjecucion(id: string, ejecucion: any) {
    return this.pipeModel.findByIdAndUpdate(id, { $push: { ejecuciones: ejecucion } }, { new: true });
  }
  
  createDeployment(dto: CreateDeploymentDto) { return new this.deplModel({ ...dto, fechaDespliegue: new Date() }).save(); }
  findAllDeployments(proyectoId?: string) { return this.deplModel.find(proyectoId ? { proyecto: proyectoId } : {}).populate('proyecto pipeline desplegadoPor', '-password').exec(); }
  async findOneDeployment(id: string) {
    const r = await this.deplModel.findById(id).populate('proyecto pipeline desplegadoPor');
    if (!r) throw new NotFoundException('Despliegue no encontrado');
    return r;
  }
  async updateDeployment(id: string, dto: UpdateDeploymentDto) {
    const r = await this.deplModel.findByIdAndUpdate(id, dto, { new: true });
    if (!r) throw new NotFoundException('Despliegue no encontrado');
    return r;
  }
}

// Controller
@ApiTags('DevOps')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('devops')
export class DevopsController {
  constructor(private readonly svc: DevopsService) {}
  @Post('pipelines') @ApiOperation({ summary: '[DO] Crear pipeline CI/CD' }) createPipe(@Body() dto: CreatePipelineDto) { return this.svc.createPipeline(dto); }
  @Get('pipelines') @ApiOperation({ summary: '[DO] Listar pipelines' }) findAllPipes() { return this.svc.findAllPipelines(); }
  @Get('pipelines/:id') @ApiOperation({ summary: '[DO] Obtener pipeline' }) findOnePipe(@Param('id') id: string) { return this.svc.findOnePipeline(id); }
  @Patch('pipelines/:id') @ApiOperation({ summary: '[DO] Actualizar pipeline' }) updatePipe(@Param('id') id: string, @Body() dto: UpdatePipelineDto) { return this.svc.updatePipeline(id, dto); }
  @Post('pipelines/:id/ejecuciones') @ApiOperation({ summary: '[DO] Registrar ejecución del pipeline' }) addExec(@Param('id') id: string, @Body() body: any) { return this.svc.addEjecucion(id, body); }
  @Post('deployments') @ApiOperation({ summary: '[DO] Registrar despliegue' }) createDep(@Body() dto: CreateDeploymentDto) { return this.svc.createDeployment(dto); }
  @Get('deployments') @ApiOperation({ summary: '[DO] Historial de despliegues' }) findAllDeps() { return this.svc.findAllDeployments(); }
  @Get('deployments/:id') @ApiOperation({ summary: '[DO] Obtener despliegue' }) findOneDep(@Param('id') id: string) { return this.svc.findOneDeployment(id); }
  @Patch('deployments/:id') @ApiOperation({ summary: '[DO] Actualizar estado del despliegue' }) updateDep(@Param('id') id: string, @Body() dto: UpdateDeploymentDto) { return this.svc.updateDeployment(id, dto); }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pipeline.name, schema: PipelineSchema },
      { name: Deployment.name, schema: DeploymentSchema },
    ]),
  ],
  controllers: [DevopsController],
  providers: [DevopsService],
})
export class DevopsModule {}
