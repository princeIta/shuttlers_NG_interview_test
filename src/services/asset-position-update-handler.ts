import { IRepository, Position } from '../repository';
import eventEmitter, { eventTypes } from '../event';

export default class AssetPositionUpdateHandler {
  data: IRepository;
  constructor(data: IRepository) {
    this.data = data;
  }

  updatePosition(assetId: number, pos: Position) {
    const assetEnt = this.data.updateAssetPosition(assetId, pos);
    eventEmitter.emit(eventTypes.positionUpdated, assetEnt);
    return assetEnt;
  }
}
