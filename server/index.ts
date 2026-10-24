import { createApp } from './app';
import { SERVER_PORT } from './config';

createApp().listen(SERVER_PORT, () => {
  console.log(`API listening on http://localhost:${SERVER_PORT}`);
});
