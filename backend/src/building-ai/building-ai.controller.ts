import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { User } from 'src/users/user.model';
import { AskBuildingDto } from './dto/ask-building.dto';
import { BuildingAiService } from './building-ai.service';
import { BuildingAccessService } from 'src/app-auth/building-access.service';
import { CreateAiPromptDto } from './dto/create-ai-prompt.dto';
import { UpdateAiPromptDto } from './dto/update-ai-prompt.dto';

@Controller()
export class BuildingAiController {
    constructor(
        private readonly buildingAiService: BuildingAiService,
        private readonly buildingAccessService: BuildingAccessService,
    ) {}

    @Post('buildings/:buildingId/ask-ai')
    @AuthPermissions(Permissions.BuildingRead)
    async askBuildingAi(
        @CurrentUser() actor: User,
        @Param('buildingId') buildingId: string,
        @Body() body: AskBuildingDto,
    ) {
        return this.buildingAiService.askBuilding(actor, buildingId, body.question);
    }

    @Get('ai-dashboard/overview')
    @AuthPermissions(Permissions.UserRead)
    async getAiDashboardOverview(@CurrentUser() actor: User) {
        const isSuperAdmin = await this.buildingAccessService.isSuperAdmin(actor);
        if (!isSuperAdmin) throw new ForbiddenException('SuperAdmin access required');
        return this.buildingAiService.getDashboardOverview();
    }

    @Get('ai-dashboard/prompts')
    @AuthPermissions(Permissions.UserRead)
    async listPrompts(@CurrentUser() actor: User) {
        const isSuperAdmin = await this.buildingAccessService.isSuperAdmin(actor);
        if (!isSuperAdmin) throw new ForbiddenException('SuperAdmin access required');
        return this.buildingAiService.listPrompts();
    }

    @Post('ai-dashboard/prompts')
    @AuthPermissions(Permissions.UserRead)
    async createPrompt(@CurrentUser() actor: User, @Body() body: CreateAiPromptDto) {
        const isSuperAdmin = await this.buildingAccessService.isSuperAdmin(actor);
        if (!isSuperAdmin) throw new ForbiddenException('SuperAdmin access required');
        return this.buildingAiService.createPrompt(actor, body);
    }

    @Patch('ai-dashboard/prompts/:id')
    @AuthPermissions(Permissions.UserRead)
    async updatePrompt(@CurrentUser() actor: User, @Param('id') id: string, @Body() body: UpdateAiPromptDto) {
        const isSuperAdmin = await this.buildingAccessService.isSuperAdmin(actor);
        if (!isSuperAdmin) throw new ForbiddenException('SuperAdmin access required');
        return this.buildingAiService.updatePrompt(id, body);
    }

    @Post('ai-dashboard/prompts/:id/activate')
    @AuthPermissions(Permissions.UserRead)
    async activatePrompt(@CurrentUser() actor: User, @Param('id') id: string) {
        const isSuperAdmin = await this.buildingAccessService.isSuperAdmin(actor);
        if (!isSuperAdmin) throw new ForbiddenException('SuperAdmin access required');
        return this.buildingAiService.activatePrompt(id);
    }
}
