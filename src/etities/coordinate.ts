export default class Coordinate {
  lat: number;
  lon: number;
  constructor(lat: number, lon: number) {
    this.lat = lat;
    this.lon = lon;
  }

  distanceFrom(coord: Coordinate): number {
    const lat1 = this.lat;
    const lon1 = this.lon;
    const lat2 = coord.lat;
    const lon2 = coord.lon;

    const R = 6371 * 1000; // Radius of the earth in meters
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
  }

  deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
}
