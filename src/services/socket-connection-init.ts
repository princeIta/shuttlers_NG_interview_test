import { Socket } from 'socket.io';

import { ClientDto, IRepository } from '../repository';

export default class SocketInit {
  repository: IRepository;
  // timer?: NodeJS.Timeout;
  constructor(repository: IRepository) {
    this.repository = repository;
  }

  setup(socket: Socket) {
    const assetIdsStr = <string>socket.handshake.query.assets;
    const assetIds = assetIdsStr.split(/\s*,\s*/);
    const lat = <string>socket.handshake.query.lat;
    const lon = <string>socket.handshake.query.lon;

    if (assetIds) {
      socket.join(assetIds);
      this.registerClient(
        { assets: assetIds.map(Number), lat: +lat, lon: +lon },
        socket
      );
    }

    socket.on('disconnect', () => {
      this.removeClient(socket.id);
    });
  }

  protected removeClient(socketId: string) {
    this.repository.removeClient(socketId);
  }

  protected registerClient(client: ClientDto, socket: Socket) {
    this.repository.addUser(client, socket.id);
  }
}
