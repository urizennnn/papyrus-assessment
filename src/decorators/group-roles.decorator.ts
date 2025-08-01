import { SetMetadata } from '@nestjs/common';

export const GROUP_ROLE_KEY = 'groupRole';
export const GroupMember = () => SetMetadata(GROUP_ROLE_KEY, 'member');
export const GroupAdmin = () => SetMetadata(GROUP_ROLE_KEY, 'admin');
