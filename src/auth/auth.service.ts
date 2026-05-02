import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.activo) throw new UnauthorizedException('Usuario inactivo');

    const payload = { sub: user._id, email: user.email, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol },
    };
  }

  async register(dto: any) {
    const user = await this.usersService.create(dto);
    const payload = { sub: user._id, email: user.email, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol },
    };
  }
}
