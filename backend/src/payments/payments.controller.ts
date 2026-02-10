import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from 'src/app-auth/guards/app-auth.base.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags(Endpoints.Payments)
@Controller(Endpoints.Payments)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Get()
    @Public()
    async findAll() {
        return this.paymentsService.findAll({});
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string) {
        const payment = await this.paymentsService.findById(id);
        if (!payment) throw new NotFoundException('Payment not found');
        return payment;
    }

    @Post()
    @Public()
    async create(@Body() data: CreatePaymentDto) {
        // Upsert: if payment exists for same property/year/month, update it
        return this.paymentsService.upsert(
            { propertyId: data.propertyId, year: data.year, month: data.month },
            { $set: { amount: data.amount, propertyId: data.propertyId, year: data.year, month: data.month } },
        );
    }

    @Put(':id')
    @Public()
    async update(@Param('id') id: string, @Body() data: UpdatePaymentDto) {
        const result = await this.paymentsService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Payment not found');
        return result;
    }

    @Delete(':id')
    @Public()
    async remove(@Param('id') id: string) {
        const result = await this.paymentsService.deleteById(id);
        if (!result) throw new NotFoundException('Payment not found');
        return { message: 'Payment deleted successfully' };
    }
}
