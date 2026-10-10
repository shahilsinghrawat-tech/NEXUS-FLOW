import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { redisClient } from '../config/redis.js';
import { exceptionQueue } from '../queues/exceptionQueue.js';
import { Exception } from '../models/Exception.js';
import { Product } from '../models/Product.js';

const router = Router();

const WebhookEventSchema = z.object({
    eventType: z.enum([
        'INVENTORY_SYNC',
        'QUALITY_INSPECTION',
        'SHIPMENT_ETA_UPDATE',
        'COLD_CHAIN_TELEMETRY',
        'INVOICE_RECEIVED'
    ]),
    sku: z.string().min(3),
    data: z.record(z.string(), z.any())
});

router.post('/webhooks/event', async (req: Request, res: Response): Promise<void> => {
    try {
        const idempotencyKey = req.headers['x-idempotency-key'] as string;
        if (!idempotencyKey) {
            res.status(400).json({ error: 'Missing required header: x-idempotency-key' });
            return;
        }

        const isFirstSeen = await redisClient.set(
            `idemp:${idempotencyKey}`,
            'LOCKED',
            'EX',
            86400,
            'NX'
        );

        if (!isFirstSeen) {
            res.status(200).json({
                status: 'DUPLICATE_IGNORED',
                message: `Event ${idempotencyKey} was already processed.`
            });
            return;
        }

        const parsedPayload = WebhookEventSchema.safeParse(req.body);
        if (!parsedPayload.success) {
            await redisClient.del(`idemp:${idempotencyKey}`); // Release lock if payload is invalid
            res.status(422).json({
                error: 'Invalid webhook payload',
                details: parsedPayload.error.flatten()
            });
            return;
        }

        const job = await exceptionQueue.add('evaluate-supply-event', parsedPayload.data, {
            jobId: idempotencyKey
        });

        res.status(202).json({
            status: 'QUEUED',
            jobId: job.id,
            idempotencyKey
        });
    } catch (error: any) {
        console.error('[Webhook Error]:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/exceptions', async (req: Request, res: Response): Promise<void> => {
  const { status = 'OPEN', domain } = req.query;
  const filter: Record<string, any> = {};
  
  if (status !== 'ALL') filter.status = status;
  if (domain && domain !== 'ALL') filter.domain = domain;

  const exceptions = await Exception.find(filter)
    .sort({ priorityScore: -1, createdAt: -1 }) 
    .limit(100)
    .lean();

  res.json(exceptions);
});

router.get('/products', async (_req: Request, res: Response): Promise<void> => {
  const products = await Product.find({}).sort({ tier: -1 }).lean();
  res.json(products);
});

export default router;