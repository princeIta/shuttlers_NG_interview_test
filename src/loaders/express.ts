import express, { Application as ExpressApp } from 'express';

import appRoutes from '../routes';

export default function (app: ExpressApp) {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/', appRoutes);
}
