import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../common/errors/domain.errors';
import { UserDto } from './dto/user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { toUserDto } from './mappers/user.mapper';
import { IUserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getMe(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toUserDto(user);
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<UserDto> {
    const updated = await this.userRepository.updateProfile(userId, dto);
    return toUserDto(updated);
  }
}
