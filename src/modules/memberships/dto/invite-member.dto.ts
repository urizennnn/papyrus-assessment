import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from '../entities/membership.entity';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;
}
