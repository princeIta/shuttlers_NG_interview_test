import EventEmitter from 'events';

const eventEmitter = new EventEmitter();

export default eventEmitter;

export const eventTypes = {
  positionUpdated: 'position-updated'
};
