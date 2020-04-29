import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request, Response } from 'express';

import { UserService } from './user.service';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/watchlist')
  async getWatchlist(@Req() req: Request) {
    let uid = req['uid'];

    let results = await this.userService.watchlist(uid);
    return results;
  }



  @Post('/watchlist/:symbol')
  async subscribe(@Req() req: Request, @Param('symbol') symbol: string) {
    let uid = req['uid'];

    let response = await this.userService.subscribe(uid, symbol.toUpperCase());
    return response;
  }

  @Delete('/watchlist/:symbol')
  async unsubscribe(@Req() req: Request, @Param('symbol') symbol: string) {
    let uid = req['uid'];
    let response = await this.userService.unsubscribe(uid, symbol.toUpperCase());
    return response;
  }

  @Get('/pushtoken')
  async getPushToken(@Req() req: Request) {
    let uid = req['uid'];
    let response = await this.userService.getPushToken(uid);
    return response;
  }

  @Post('/pushtoken/:token')
  async registerPushToken(@Req() req: Request, @Param('token') token: string) {
    let uid = req['uid'];
    console.log("Token: ", token);
    await this.userService.registerPushToken(uid, token);

    return {
      success: true
    }
  }

  @Get('/stock/:symbol')
  async stockSnapshot(@Param('symbol') symbol: string) {
    let response = await this.userService.stockSnapshot(symbol);
    return response;
  }

  @Get('/alerts')
  async getAlerts(@Req() req: Request) {
    let uid = req['uid'];
    let response = await this.userService.getAlerts(uid);
    return response;
  }

  @Post('/alerts')
  async createAlert(@Req() req: Request,
    @Query('symbol') symbol: string,
    @Query('type') type: number,
    @Query('condition') condition: number,
    @Query('value') value: number) {
    console.log(`symbol: ${symbol}`);
    let uid = req['uid'];
    let response = await this.userService.createAlert(uid, symbol, type, condition, value);
    return response;
  }

  @Delete('/alerts/:alertID')
  async deleteAlert(@Req() req: Request, @Param('alertID') alertID: string) {
    return {
      alertID
    }
  }


  /*@Get('/polygon')
  async poylgon() {
    // let response = await this.userService.polygon();
    // console.log("Controller: ", response);
    let response = await this.userService.polygon();;
    return response;
  }*/

}
