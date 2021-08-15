import AssetEnt from '../etities/asset';
import ClientEnt from '../etities/client';

export default <IRepository>{
  data: { assets: <Array<Asset>>[], clients: <Array<Client>>[] },
  updateAssetPosition(assetId: number, pos: Position) {
    const asset = this.data.assets.find((asset) => asset.id === assetId);
    if (asset) {
      asset.lat = +pos.lat;
      asset.lon = +pos.lon;
      return new AssetEnt(asset);
    }
    return null;
  },
  addUser(client: ClientDto, socketId: string) {
    const c: Client = {
      ...client,
      socketId,
      id: this.data.clients.length
    };

    this.data.clients.push(c);
    return new ClientEnt(c);
  },
  getAllAssets() {
    return this.data.assets.map((asset) => new AssetEnt(asset));
  },
  getClientAssets(clientId: number) {
    const client = this.data.clients.find((client) => client.id === clientId);
    if (!client) {
      return null;
    }
    const clientAssetsId = client.assets;
    return this.data.assets
      .filter((asset) => clientAssetsId.includes(asset.id))
      .map((asset) => new AssetEnt(asset));
  },
  getAssetClients(assetId: number) {
    return this.data.clients
      .filter((client) => client.assets.includes(assetId))
      .map((client) => new ClientEnt(client));
  },
  removeClient(socketId: string) {
    this.data.clients = this.data.clients.filter(
      (client) => client.socketId !== socketId
    );
  }
};

export interface IRepository {
  data: { assets: Array<Asset>; clients: Array<Client> };
  updateAssetPosition(assetId: number, pos: Position): AssetEnt | null;
  addUser(client: ClientDto, socketId: string): ClientEnt;
  getAllAssets(): Array<AssetEnt>;
  getClientAssets(clientId: number): Array<AssetEnt> | null;
  getAssetClients(assetId: number): Array<ClientEnt>;
  removeClient(socketId: string): void;
}

export type ClientDto = {
  assets: number[];
  lat: number;
  lon: number;
};
export interface Client extends ClientDto {
  id: number;
  socketId: string;
}
export type Asset = { id: number; lat: number; lon: number };
export type Position = { lat: number; lon: number };
