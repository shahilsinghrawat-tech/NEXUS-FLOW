import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initExceptionWorker } from './queues/exceptionQueue.js';
import webhookRoutes from './routes/webhookRoutes.js';
import resolutionRoutes from './routes/resolutionRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/v1', webhookRoutes);
app.use('/api/v1', resolutionRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'NexusTower Engine' });
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Planner connected: ${socket.id}`);
});

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap() {
  await connectDB();
  initExceptionWorker(io);

  server.listen(PORT, () => {
    console.log(`\n🚀 [NexusTower Server] Running on http://localhost:${PORT}`);
    console.log(`📡 [Webhooks Endpoint] POST http://localhost:${PORT}/api/v1/webhooks/event`);
    console.log(`📊 [Exceptions Feed]   GET  http://localhost:${PORT}/api/v1/exceptions\n`);
  });
}

bootstrap();