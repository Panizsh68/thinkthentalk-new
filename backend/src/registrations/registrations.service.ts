import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRegistrationDto } from './dto/user-registration.dto';
import { UserRegistrationDetailsDto } from './dto/user-registration-details.dto';
import { RegistrationsRepository, AdminRegistrationFilter } from './registrations.repository';
import {
  userRegistrationDetailsEntityToDto,
  userRegistrationEntityToDto,
} from './mappers/registration.mapper';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { UpdateRegistrationAdminDto } from './dto/update-registration-admin.dto';
import { BadRequestException } from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';

@Injectable()
export class RegistrationsService {
  constructor(private readonly registrationsRepository: RegistrationsRepository) {}

  async getMyRegistrations(userId: string): Promise<UserRegistrationDto[]> {
    const entities = await this.registrationsRepository.findUserRegistrations(userId);
    return entities.map(userRegistrationEntityToDto) as any;
  }

  async getAdminRegistrations(
    filters: AdminRegistrationFilter,
  ): Promise<UserRegistrationDetailsDto[]> {
    const entities = await this.registrationsRepository.findAllAdminRegistrations(filters);
    return entities.map(userRegistrationDetailsEntityToDto) as any;
  }

  async exportAdminRegistrations(
    filters: AdminRegistrationFilter,
  ): Promise<UserRegistrationDetailsDto[]> {
    const entities = await this.registrationsRepository.findAllAdminRegistrations({
      ...filters,
      status: RegistrationStatus.PAID,
    });
    return entities.map(userRegistrationDetailsEntityToDto) as any;
  }

  async getRegistrationDetails(registrationId: string): Promise<UserRegistrationDetailsDto> {
    const entity = await this.registrationsRepository.findByIdWithDetails(registrationId);
    if (!entity) {
      throw new NotFoundException('Registration not found.');
    }
    return userRegistrationDetailsEntityToDto(entity) as any;
  }

  async updateRegistration(
    registrationId: string,
    updateDto: UpdateRegistrationDto | UpdateRegistrationAdminDto,
  ): Promise<UserRegistrationDetailsDto | null> {
    const entity = await this.registrationsRepository.findByIdWithDetails(registrationId);
    if (!entity) {
      return null;
    }

    if (entity.status === 'PAID' && updateDto.status && updateDto.status !== 'PAID') {
      throw new BadRequestException('Cannot change status from PAID to another state.');
    }

    const updated = await this.registrationsRepository.updateRegistration(registrationId, {
      status: updateDto.status,
      paymentId: (updateDto as any).paymentId,
      formData: updateDto.formData,
    });
    return userRegistrationDetailsEntityToDto(updated) as any;
  }
}
