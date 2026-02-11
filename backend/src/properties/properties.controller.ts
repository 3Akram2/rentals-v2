import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { PropertiesService } from './properties.service';
import { PaymentsService } from '../payments/payments.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';
import { BuildingAccessService } from 'src/app-auth/building-access.service';

@ApiTags(Endpoints.Properties)
@Controller(Endpoints.Properties)
export class PropertiesController {
    constructor(
        private readonly propertiesService: PropertiesService,
        private readonly paymentsService: PaymentsService,
        private readonly buildingAccessService: BuildingAccessService,
    ) {}

    private async getPropertyOrThrow(id: string) {
        const property = await this.propertiesService.findById(id);
        if (!property) throw new NotFoundException('Property not found');
        return property;
    }

    @Get()
    @AuthPermissions(Permissions.PropertyRead)
    async findAll(@CurrentUser() user: User) {
        const buildingFilter = await this.buildingAccessService.buildingFilter(user, 'buildingId');
        return this.propertiesService.findAll(buildingFilter);
    }

    @Get(':id')
    @AuthPermissions(Permissions.PropertyRead)
    async findOne(@Param('id') id: string, @CurrentUser() user: User) {
        const property = await this.getPropertyOrThrow(id);
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));
        return property;
    }

    @Get(':id/payments')
    @AuthPermissions(Permissions.PaymentRead)
    async getPayments(@Param('id') id: string, @CurrentUser() user: User) {
        const property = await this.getPropertyOrThrow(id);
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));
        return this.paymentsService.findAll({ propertyId: id }, { sort: { year: -1, month: -1 } });
    }

    @Get(':id/payments/:year')
    @AuthPermissions(Permissions.PaymentRead)
    async getPaymentsByYear(@Param('id') id: string, @Param('year') year: string, @CurrentUser() user: User) {
        const property = await this.getPropertyOrThrow(id);
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));
        return this.paymentsService.findAll(
            { propertyId: id, year: parseInt(year) },
            { sort: { month: 1 } },
        );
    }

    @Post()
    @AuthPermissions(Permissions.PropertyCreate)
    async create(@Body() data: CreatePropertyDto, @CurrentUser() user: User) {
        await this.buildingAccessService.assertBuildingAccess(user, data.buildingId);
        const existing = await this.propertiesService.findOne({
            buildingId: data.buildingId,
            unit: data.unit,
        });
        if (existing) {
            return { error: 'unitExists' };
        }
        return this.propertiesService.create(data as any);
    }

    @Put(':id')
    @AuthPermissions(Permissions.PropertyUpdate)
    async update(@Param('id') id: string, @Body() data: UpdatePropertyDto, @CurrentUser() user: User) {
        const property = await this.getPropertyOrThrow(id);
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));

        const result = await this.propertiesService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Property not found');
        return result;
    }

    @Delete(':id')
    @AuthPermissions(Permissions.PropertyDelete)
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
        const property = await this.getPropertyOrThrow(id);
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));

        await this.paymentsService.deleteMany({ propertyId: id });
        const result = await this.propertiesService.deleteById(id);
        if (!result) throw new NotFoundException('Property not found');
        return { message: 'Property deleted successfully' };
    }
}
