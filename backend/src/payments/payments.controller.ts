import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AuthPermissions } from 'src/app-auth/guards/app-permissions.guard';
import { Permissions } from 'src/groups/enums/permissions.enum';
import { PropertiesService } from 'src/properties/properties.service';
import { CurrentUser } from 'src/app-auth/user.decorator';
import { User } from 'src/users/user.model';
import { BuildingAccessService } from 'src/app-auth/building-access.service';

@ApiTags(Endpoints.Payments)
@Controller(Endpoints.Payments)
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly propertiesService: PropertiesService,
        private readonly buildingAccessService: BuildingAccessService,
    ) {}

    @Get()
    @AuthPermissions(Permissions.PaymentRead)
    async findAll(@CurrentUser() user: User) {
        const buildingFilter = await this.buildingAccessService.buildingFilter(user, 'buildingId');
        const properties = await this.propertiesService.findAll(buildingFilter, { projection: { _id: 1 } });
        const propertyIds = properties.map((p: any) => p._id);
        return this.paymentsService.findAll({ propertyId: { $in: propertyIds } });
    }

    @Get(':id')
    @AuthPermissions(Permissions.PaymentRead)
    async findOne(@Param('id') id: string, @CurrentUser() user: User) {
        const payment = await this.paymentsService.findById(id);
        if (!payment) throw new NotFoundException('Payment not found');

        const property = await this.propertiesService.findById(String((payment as any).propertyId));
        if (!property) throw new NotFoundException('Property not found');
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));

        return payment;
    }

    @Post()
    @AuthPermissions(Permissions.PaymentCreate)
    async create(@Body() data: CreatePaymentDto, @CurrentUser() user: User) {
        const property = await this.propertiesService.findById(data.propertyId);
        if (!property) throw new NotFoundException('Property not found');
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));

        return this.paymentsService.upsert(
            { propertyId: data.propertyId, year: data.year, month: data.month },
            { $set: { amount: data.amount, propertyId: data.propertyId, year: data.year, month: data.month } },
        );
    }

    @Put(':id')
    @AuthPermissions(Permissions.PaymentUpdate)
    async update(@Param('id') id: string, @Body() data: UpdatePaymentDto, @CurrentUser() user: User) {
        const payment = await this.paymentsService.findById(id);
        if (!payment) throw new NotFoundException('Payment not found');

        const property = await this.propertiesService.findById(String((payment as any).propertyId));
        if (!property) throw new NotFoundException('Property not found');
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));

        const result = await this.paymentsService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Payment not found');
        return result;
    }

    @Delete(':id')
    @AuthPermissions(Permissions.PaymentDelete)
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
        const payment = await this.paymentsService.findById(id);
        if (!payment) throw new NotFoundException('Payment not found');

        const property = await this.propertiesService.findById(String((payment as any).propertyId));
        if (!property) throw new NotFoundException('Property not found');
        await this.buildingAccessService.assertBuildingAccess(user, String((property as any).buildingId));

        const result = await this.paymentsService.deleteById(id);
        if (!result) throw new NotFoundException('Payment not found');
        return { message: 'Payment deleted successfully' };
    }
}
