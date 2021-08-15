import { Client } from '../repository';

export default class ClientEnt {
  id: number;
  socketId: string;
  assets: number[];
  lat: number;
  lon: number;
  constructor(client: Client) {
    this.socketId = client.socketId;
    this.assets = client.assets;
    this.id = client.id;
    this.lat = client.lat;
    this.lon = client.lon;
  }
}
