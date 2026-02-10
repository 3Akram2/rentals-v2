import { Controller, Get, Post, Put, Delete, Body, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from 'src/app-auth/guards/app-auth.base.guard';
import { PropertiesService } from './properties.service';
import { PaymentsService } from '../payments/payments.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@ApiTags(Endpoints.Properties)
@Controller(Endpoints.Properties)
export class PropertiesController {
    constructor(
        private readonly propertiesService: PropertiesService,
        private readonly paymentsService: PaymentsService,
    ) {}

    @Get()
    @Public()
    async findAll() {
        return this.propertiesService.findAll({});
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string) {
        const property = await this.propertiesService.findById(id);
        if (!property) throw new NotFoundException('Property not found');
        return property;
    }

    @Get(':id/payments')
    @Public()
    async getPayments(@Param('id') id: string) {
        return this.paymentsService.findAll({ propertyId: id }, { sort: { year: -1, month: -1 } });
    }

    @Get(':id/payments/:year')
    @Public()
    async getPaymentsByYear(@Param('id') id: string, @Param('year') year: string) {
        return this.paymentsService.findAll(
            { propertyId: id, year: parseInt(year) },
            { sort: { month: 1 } },
        );
    }

    @Post()
    @Public()
    async create(@Body() data: CreatePropertyDto) {
        // Check for duplicate unit in building
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
    @Public()
    async update(@Param('id') id: string, @Body() data: UpdatePropertyDto) {
        const result = await this.propertiesService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Property not found');
        return result;
    }

    @Delete(':id')
    @Public()
    async remove(@Param('id') id: string) {
        // Cascade delete payments for this property
        await this.paymentsService.deleteMany({ propertyId: id });
        const result = await this.propertiesService.deleteById(id);
        if (!result) throw new NotFoundException('Property not found');
        return { message: 'Property deleted successfully' };
    }
}
