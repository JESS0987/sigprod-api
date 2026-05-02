import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/user.dto';
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class LoginDto {
  @ApiProperty({ example: 'admin@techsoft.com.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión - obtener JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registrar primer admin del sistema' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }
}
