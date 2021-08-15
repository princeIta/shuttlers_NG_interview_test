import { Router } from 'express';

import AssetHandler from './handlers/rest/asset';

const assetHandler = new AssetHandler();
const router = Router();

router.put('/position/:assetId', (...args) =>
  assetHandler.handlePositionChange(...args)
);

export default router;
