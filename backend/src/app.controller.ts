import { Controller, Get } from '@nestjs/common';
import { config } from 'rxjs';

@Controller()
export class AppController {

  @Get()
  getHello(): string {
    return "hello"
  }






}
