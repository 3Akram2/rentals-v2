import { PartialType } from '@nestjs/swagger';
import { CreateRentalUserDto } from './create-rental-user.dto';

export class UpdateRentalUserDto extends PartialType(CreateRentalUserDto) {}
