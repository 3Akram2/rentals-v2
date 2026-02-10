import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoints } from 'src/shared/constants';
import { Public } from 'src/app-auth/guards/app-auth.base.guard';
import { BuildingsService } from './buildings.service';
import { PropertiesService } from '../properties/properties.service';
import { CreateBuildingDto } from './dto/create-building.dto';

@ApiTags(Endpoints.Buildings)
@Controller(Endpoints.Buildings)
export class BuildingsController {
    constructor(
        private readonly buildingsService: BuildingsService,
        @Inject(forwardRef(() => PropertiesService))
        private readonly propertiesService: PropertiesService,
    ) {}

    @Get()
    @Public()
    async findAll() {
        return this.buildingsService.findAll({});
    }

    @Get(':id')
    @Public()
    async findOne(@Param('id') id: string) {
        const building = await this.buildingsService.findById(id);
        if (!building) throw new NotFoundException('Building not found');
        return building;
    }

    @Get(':id/properties')
    @Public()
    async getProperties(@Param('id') id: string) {
        return this.propertiesService.findAll({ buildingId: id });
    }

    @Post()
    @Public()
    async create(@Body() data: CreateBuildingDto) {
        return this.buildingsService.create(data as any);
    }

    @Put(':id')
    @Public()
    async update(@Param('id') id: string, @Body() data: any) {
        const result = await this.buildingsService.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );
        if (!result) throw new NotFoundException('Building not found');
        return result;
    }

    @Delete(':id')
    @Public()
    async remove(@Param('id') id: string) {
        // Cascade delete: properties and their payments
        const properties = await this.propertiesService.findAll({ buildingId: id });
        for (const prop of properties) {
            await this.propertiesService.deleteById((prop as any)._id);
        }
        const result = await this.buildingsService.deleteById(id);
        if (!result) throw new NotFoundException('Building not found');
        return { message: 'Building deleted successfully' };
    }
}
