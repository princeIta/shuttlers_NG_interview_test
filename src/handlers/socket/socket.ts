import { Server, Socket } from 'socket.io';
import repository, { IRepository } from '../../repository';
import SocketInit from '../../services/socket-connection-init';

const socketInit = new SocketInit(repository);

let isTrottling = false;

export default class SocketHandler {
  timer?: NodeJS.Timeout;

  constructor(io: Server, repository: IRepository) {
    if (!isTrottling) {
      this.timer = setInterval(() => {
        const allAssets = repository.getAllAssets();
        allAssets.forEach((asset) => {
          io.to(String(asset.id)).emit('position-update', asset);
        });
      }, 5000);
    }
  }

  onConnect(socket: Socket) {
    socketInit.setup(socket);
  }
}
