import { Global, Module } from '@nestjs/common';
import { AppAuthService } from './app-auth.service';
import { AppAuthController } from './app-auth.controller';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppJWTAuthGuard } from './guards/app-auth.jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { LocalStrategy } from './strategies/local.strategy';
import { JWTStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/app-permissions.guard';
import { IsSuperAdminGuard } from './guards/super-admin.guard';
import { BuildingAccessService } from './building-access.service';
import { SuperAdminAccessGuard } from './guards/super-admin-access.guard';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService): JwtModuleOptions => {
                const jwtConfig = configService.get('server')['authentication']['jwt'];
                const options: JwtModuleOptions = { ...jwtConfig };
                return options;
            },
        }),
    ],
    providers: [
        AppAuthService,
        {
            //enable AppAuthGuard globally on all routes, only exclude routes annotated with @Public()
            provide: APP_GUARD,
            useClass: AppJWTAuthGuard,
        },
        LocalStrategy,
        JWTStrategy,
        PermissionsGuard,
        IsSuperAdminGuard,
        BuildingAccessService,
        SuperAdminAccessGuard,
    ],
    controllers: [AppAuthController],
    exports: [AppAuthService, JwtModule, BuildingAccessService],
})
export class AppAuthModule {}
