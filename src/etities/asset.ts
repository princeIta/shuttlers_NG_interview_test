import { Asset } from '../repository';
import Coordinate from './coordinate';

export default class AssetEnt {
  id: number;
  lon: number;
  lat: number;
  constructor(asset: Asset) {
    this.id = asset.id;
    this.lat = asset.lat;
    this.lon = asset.lon;
  }

  isWithinProximity(cord: Coordinate) {
    const assetCoord = new Coordinate(this.lat, this.lon);
    const distance = Math.round(assetCoord.distanceFrom(cord));

    const is100MetersAndBelow = distance <= 100;
    const isBelow100AndIsDivisibleBy10 =
      is100MetersAndBelow && distance % 10 === 0;

    return isBelow100AndIsDivisibleBy10;
  }
}
