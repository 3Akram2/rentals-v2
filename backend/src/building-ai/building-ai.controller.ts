import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { User } from 'src/users/user.model';
import { AskBuildingDto } from './dto/ask-building.dto';
import { BuildingAiService } from './building-ai.service';
import { SuperAdminAccessGuard } from 'src/app-auth/guards/super-admin-access.guard';
import { CreateAiPromptDto } from './dto/create-ai-prompt.dto';
import { UpdateAiPromptDto } from './dto/update-ai-prompt.dto';

@Controller()
export class BuildingAiController {
    constructor(private readonly buildingAiService: BuildingAiService) {}

    @Post('buildings/:buildingId/ask-ai')
    @AuthPermissions(Permissions.BuildingRead)
    async askBuildingAi(
        @CurrentUser() actor: User,
        @Param('buildingId') buildingId: string,
        @Body() body: AskBuildingDto,
    ) {
        return this.buildingAiService.askBuilding(actor, buildingId, body.question, body.history || []);
    }

    @Get('ai-dashboard/overview')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async getAiDashboardOverview() {
        return this.buildingAiService.getDashboardOverview();
    }

    @Get('ai-dashboard/prompts')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async listPrompts() {
        return this.buildingAiService.listPrompts();
    }

    @Post('ai-dashboard/prompts')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async createPrompt(@CurrentUser() actor: User, @Body() body: CreateAiPromptDto) {
        return this.buildingAiService.createPrompt(actor, body);
    }

    @Patch('ai-dashboard/prompts/:id')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async updatePrompt(@Param('id') id: string, @Body() body: UpdateAiPromptDto) {
        return this.buildingAiService.updatePrompt(id, body);
    }

    @Post('ai-dashboard/prompts/:id/activate')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async activatePrompt(@Param('id') id: string) {
        return this.buildingAiService.activatePrompt(id);
    }

    @Delete('ai-dashboard/prompts/:id')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async deletePrompt(@Param('id') id: string) {
        return this.buildingAiService.deletePrompt(id);
    }

    @Delete('ai-dashboard/chats/:id')
    @UseGuards(SuperAdminAccessGuard)
    @AuthPermissions(Permissions.UserRead)
    async deleteChat(@Param('id') id: string) {
        return this.buildingAiService.deleteChat(id);
    }
}
