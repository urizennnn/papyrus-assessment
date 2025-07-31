import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OrderDir } from 'src/types';

export class PaginationInput {
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  orderBy?: string = '';

  @IsOptional()
  @IsEnum(OrderDir)
  orderDir?: OrderDir;
}

export class PaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  pages: number;

  @ApiProperty()
  offset?: number;
}

export class BasePaginatedResponseDto {
  pagination?: PaginationDto;

  data: any;
}

export class PaginationQuery {
  @ValidateNested()
  @Type(() => PaginationInput)
  pagination?: PaginationInput;
}

export function createPaginatedSwaggerDto<
  TModel extends new (...args: any[]) => any,
>(model: TModel) {
  class PaginatedDto {
    @ApiProperty({ type: [model] })
    @Type(() => model)
    data: InstanceType<TModel>[];

    @ApiProperty({ type: PaginationDto })
    @Type(() => PaginationDto)
    pagination: PaginationDto;
  }

  return PaginatedDto;
}
