import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export class SimpleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('SimpleMiddleware: Olá');
    const authorization = req.headers?.authorization;

    if (authorization) {
      req['user'] = {
        nome: 'jhon',
        sobrenome: 'darksouls',
        role: 'admin',
      };
    }

    res.setHeader('header', 'Middleware');

    next();

    console.log('SimpleMiddleware: bye');

    res.on('finish', () => {
      console.log('SimpleMiddleware: finished');
    });
  }
}
