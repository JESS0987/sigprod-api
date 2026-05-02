import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) throw new ConflictException('El email ya está registrado');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({ ...dto, password: hash });
    return user.save();
  }

  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, dto: UpdateUserDto) {
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).select('-password');
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { message: 'Usuario eliminado correctamente' };
  }
}
