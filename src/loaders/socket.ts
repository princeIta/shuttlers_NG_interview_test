import { Server } from 'socket.io';
import SocketHandler from '../handlers/socket/socket';
import { Server as HttpServer } from 'http';

import eventEmitter, { eventTypes } from '../event';
import repository from '../repository';
import AssetToClientProximityChecker from '../services/asset-to-client-proximity-checker';
import AssetEnt from '../etities/asset';

const assetToClientProximityChecker = new AssetToClientProximityChecker(
  repository
);

export default function (httpServer: HttpServer) {
  const io: Server = new Server(httpServer);
  const socketHandler = new SocketHandler(io, repository);
  io.on('connection', (socket) => {
    eventEmitter.on(eventTypes.positionUpdated, (asset: AssetEnt) => {
      assetToClientProximityChecker.messageClientsWithinAssetProximity(
        asset,
        socket
      );
    });
    socketHandler.onConnect(socket);
  });

  return io;
}
