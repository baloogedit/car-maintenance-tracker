import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {Vehicle} from '@prisma/client';

import {CurrentUser} from '../shared/decorators/current-user.decorator';
import {CurrentVehicle} from '../shared/decorators/current-vehicle.decorator';
import {VehicleAccessGuard} from '../shared/guards/vehicle-access.guard';
import type {JwtPayload} from '../shared/interfaces/jwt-payload.interface';
import {CreateVehicleDto} from './dto/input/create-vehicle.dto';
import {UpdateVehicleDto} from './dto/input/update-vehicle.dto';
import {VehicleResponseDto} from './dto/output/vehicle-response.dto';
import {VehicleService} from './vehicle.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicles: VehicleService) {}

  @Get()
  @ApiOkResponse({type: [VehicleResponseDto]})
  findAll(@CurrentUser() user: JwtPayload) {
    return this.vehicles.findAll(user);
  }

  @Post()
  @ApiCreatedResponse({type: VehicleResponseDto})
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user, dto);
  }

  // Hibas formatumu vagy idegen id-ra egyarant 404 jon (a guard nem talalja a jarmuvet).
  @Get(':vehicleId')
  @ApiOkResponse({type: VehicleResponseDto})
  @UseGuards(VehicleAccessGuard)
  findOne(@CurrentVehicle() vehicle: Vehicle) {
    return this.vehicles.findOne(vehicle);
  }

  @Patch(':vehicleId')
  @ApiOkResponse({type: VehicleResponseDto})
  @UseGuards(VehicleAccessGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @CurrentVehicle() vehicle: Vehicle,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(user, vehicle, dto);
  }

  @Delete(':vehicleId')
  @ApiNoContentResponse()
  @UseGuards(VehicleAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @CurrentVehicle() vehicle: Vehicle) {
    return this.vehicles.remove(user, vehicle);
  }
}
