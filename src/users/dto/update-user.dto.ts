import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Files } from 'src/activities/interfaces';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  id?: number;
  avatar?: string;
  second_name?: string;
  files?: Files[];
}
