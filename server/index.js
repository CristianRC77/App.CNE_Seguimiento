import express from 'express';
import handler from '../api/seguimiento.js';

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(express.json({ limit: '2mb' }));
app.all('/api/seguimiento', (request, response) => handler(request, response));

app.listen(port, () => {
  console.log(`API MongoDB local disponible en http://localhost:${port}/api/seguimiento`);
});
