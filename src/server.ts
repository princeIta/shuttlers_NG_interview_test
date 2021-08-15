import express from 'express';
import http from 'http';
import loadExpress from './loaders/express';
import loadSocket from './loaders/socket';

const app = express();
const httpServer = http.createServer(app);
loadExpress(app);
loadSocket(httpServer);

const PORT = 4000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
