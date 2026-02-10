import { Body, Controller, Post, Get, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from './guards/app-auth.base.guard';
import { AppAuthService } from './app-auth.service';
import { CurrentUser } from './user.decorator';
import { LocalizationInterceptor } from 'src/shared/interceptors/localization.interceptor';
import { User } from 'src/users/user.model';
import { UserLoginDto } from './dto/user-login.dto';

@ApiTags(Endpoints.Authentication)
@Controller(Endpoints.Authentication)
@UseInterceptors(LocalizationInterceptor)
export class AppAuthController {
    constructor(private authService: AppAuthService) {}

    @Public()
    @Post('login')
    async userLogin(@Body() data: UserLoginDto) {
        return this.authService.userLogin(data);
    }

    @Get('permissions')
    @ApiBearerAuth()
    getUserPermission(@CurrentUser() user: User) {
        return this.authService.getUserPermission(user._id);
    }

    @Get('me')
    @ApiBearerAuth()
    getUserProfile(@CurrentUser() user: User) {
        return this.authService.getUserProfile(user._id);
    }
}
