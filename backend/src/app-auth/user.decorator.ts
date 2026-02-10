import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/user.model';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext): User => {
    const req = context.switchToHttp().getRequest();
    return req.user;
});
