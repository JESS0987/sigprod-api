import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from './user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'juan.perez@techsoft.com.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Contraseña123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BACKEND_DEV })
  @IsEnum(UserRole)
  rol: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
