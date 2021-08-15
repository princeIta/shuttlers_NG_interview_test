import { Socket } from 'socket.io';

import repository, { IRepository } from '../repository';
import AssetEnt from '../etities/asset';
import Coordinate from '../etities/coordinate';

export default class AssetToClientProximityChecker {
  data: IRepository;
  constructor(data: IRepository) {
    this.data = data;
  }

  protected getClientsWithinAssetProximity(asset: AssetEnt) {
    const clientEnts = repository.getAssetClients(asset.id);
    return clientEnts.filter((clientEnt) =>
      asset.isWithinProximity(new Coordinate(clientEnt.lat, clientEnt.lon))
    );
  }

  messageClientsWithinAssetProximity(asset: AssetEnt, socket: Socket) {
    if (asset) {
      const clientsWithinProximity = this.getClientsWithinAssetProximity(asset);
      clientsWithinProximity.forEach((clientEnt) => {
        socket.to(clientEnt.socketId).emit('proximity', asset);
      });
    }
  }
}
