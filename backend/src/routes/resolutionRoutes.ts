import { Router, Request, Response } from 'express';
import { Exception } from '../models/Exception.js';
import { Product } from '../models/Product.js';
import { io } from '../server.js';

const router = Router();

router.post('/exceptions/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { actionId, actor = 'Supply Planner' } = req.body;

  try {
    const exception = await Exception.findById(id);
    if (!exception) { res.status(404).json({ error: 'Exception not found' }); return; }
    if (exception.status === 'RESOLVED') { res.status(400).json({ error: 'Already resolved' }); return; }

    const action = exception.recommendedActions.find(a => a.actionId === actionId);
    if (!action) { res.status(400).json({ error: 'Invalid actionId' }); return; }

    // 1. VV IMP - Resolve Inventory Shortage using Optimistic Concurrency Control
    if (exception.type === 'SHORTAGE_RISK' && action.supplierId && action.orderQuantity) {
      const product = await Product.findOne({ sku: exception.rootSku });
      if (!product) throw new Error('Product not found in DAG');

      const supplier = product.backupSuppliers.find(s => s.supplierId === action.supplierId);
      
      if (!supplier || supplier.availableQuota < action.orderQuantity) {
         res.status(409).json({ error: 'Conflict: Supplier does not have enough quota left.' }); return;
      }

      supplier.availableQuota -= action.orderQuantity;
      
      // VVIMP  If another planner modified this product a millisecond ago, 
      // Mongoose OCC will block this and throw a 'VersionError'
      await product.save(); 
    }

    // 2. Update Exception Status
    exception.status = 'RESOLVED';
    exception.auditTimeline.push({ action: `Resolved via action: ${action.label}`, actor, timestamp: new Date() });
    await exception.save();

    // 3. Broadcast to React
    io.emit('exception:updated', exception);
    res.json({ status: 'SUCCESS', message: 'Exception resolved safely via OCC', exception });

  } catch (error: any) {
    // Catch the OCC Race Condition
    if (error.name === 'VersionError') {
      res.status(409).json({ error: 'Concurrency Conflict: Another planner modified this stock simultaneously.' });
      return;
    }
    console.error('[Resolution Error]:', error);
    res.status(500).json({ error: 'Resolution failed', details: error.message });
  }
});

export default router;