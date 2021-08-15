import {
  Response as ExpressResponse,
  Request as ExpressRequest,
  NextFunction as ExpressNextFunc
} from 'express';

import repository from '../../repository';
import AssetPositionUpdateService from '../../services/asset-position-update-handler';

const assetPositionUpdateService = new AssetPositionUpdateService(repository);

export default class Asset {
  handlePositionChange(
    req: ExpressRequest,
    res: ExpressResponse,
    next: ExpressNextFunc
  ) {
    const body: any = req.body;
    const { assetId } = req.params;

    const asset = assetPositionUpdateService.updatePosition(+assetId, body.pos);
    return res.status(200).json(asset);
  }
}
