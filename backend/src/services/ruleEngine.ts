import { Product } from '../models/Product.js';
import { Exception, IException } from '../models/Exception.js';
import { calculateBlastRadiusBFS } from './blastRadiusService.js';
import { Server as SocketIOServer } from 'socket.io';

export interface SupplyChainEventPayload {
    eventType:
    | 'INVENTORY_SYNC'
    | 'QUALITY_INSPECTION'
    | 'SHIPMENT_ETA_UPDATE'
    | 'COLD_CHAIN_TELEMETRY'
    | 'INVOICE_RECEIVED';
    sku: string;
    data: Record<string, any>;
}

export async function processSupplyChainEvent(
    payload: SupplyChainEventPayload,
    io: SocketIOServer | null
): Promise<IException | null> {
    const { eventType, sku, data } = payload;
    const product = await Product.findOne({ sku });

    if (!product) {
        throw new Error(`Product SKU ${sku} not found in DAG`);
    }

    let triggered = false;
    let domain: IException['domain'] = 'INVENTORY';
    let type: IException['type'] = 'SHORTAGE_RISK';
    let severity: IException['severity'] = 'MEDIUM';
    let directLoss = 0;
    let deficitUnitsForBFS = 0;
    let metadata: Record<string, any> = {};
    let auditMessage = '';

    //1.SHORTAGE_RISK (INVENTORY)

    if (eventType === 'INVENTORY_SYNC') {
    product.currentStock = data.newStockLevel;
    await product.save();

    const available = product.currentStock + product.inTransitStock;
    const sevenDayDemand = product.dailyDemand * 7;
    const requiredThreshold = product.safetyStock + sevenDayDemand;

    if (available < requiredThreshold) {
      triggered = true;
      domain = 'INVENTORY';
      type = 'SHORTAGE_RISK';
      deficitUnitsForBFS = requiredThreshold - available;
      const daysLeft = Math.floor(product.currentStock / product.dailyDemand);
      severity = daysLeft <= 2 ? 'CRITICAL' : 'HIGH';
      directLoss = deficitUnitsForBFS * product.unitRevenue;
      metadata = {
        currentStock: product.currentStock,
        safetyStock: product.safetyStock,
        deficitUnits: deficitUnitsForBFS,
        daysUntilStockout: daysLeft
      };
      auditMessage = `Inventory dropped to ${product.currentStock} units (${deficitUnitsForBFS} units below 7-day buffer).`;
    }
  } 

  //2. QUALITY_HOLD (PROCUREMENT)

  else if (eventType === 'QUALITY_INSPECTION') {
    const { poNumber, batchSize, defectiveUnits, aqlThresholdPercent = 2.5 } = data;
    const defectRatePercent = Number(((defectiveUnits / batchSize) * 100).toFixed(2));

    if (defectRatePercent > aqlThresholdPercent) {
      triggered = true;
      domain = 'PROCUREMENT';
      type = 'QUALITY_HOLD';
      deficitUnitsForBFS = batchSize; // Entire batch quarantined
      severity = defectRatePercent > 8 ? 'CRITICAL' : 'HIGH';
      directLoss = batchSize * product.unitCost;
      metadata = {
        poNumber,
        batchSize,
        defectiveUnits,
        defectRatePercent,
        aqlThresholdPercent,
        quarantinedUnits: batchSize
      };
      auditMessage = `Batch on ${poNumber} quarantined: ${defectRatePercent}% defect rate exceeds ${aqlThresholdPercent}% AQL.`;
    }
  }

  // 3. LATE_SHIPMENT (LOGISTICS)

  else if (eventType === 'SHIPMENT_ETA_UPDATE') {
    const { shipmentId, carrierName, delayHours, inTransitUnits } = data;
    const daysOfStockOnHand = Math.floor(product.currentStock / product.dailyDemand);
    const delayDays = Math.ceil(delayHours / 24);

    if (delayHours >= 24 && delayDays >= daysOfStockOnHand) {
      triggered = true;
      domain = 'LOGISTICS';
      type = 'LATE_SHIPMENT';
      deficitUnitsForBFS = inTransitUnits;
      severity = delayHours >= 72 ? 'CRITICAL' : 'HIGH';
      directLoss = inTransitUnits * product.unitCost * 0.15; // Expedite & SLA penalty cost
      metadata = {
        shipmentId,
        carrierName,
        delayHours,
        inTransitUnits,
        daysOfStockOnHand
      };
      auditMessage = `Shipment ${shipmentId} (${carrierName}) delayed by ${delayHours}h, exceeding on-hand buffer.`;
    }
  }

  // 4. COLD_CHAIN_BREACH (LOGISTICS)
  else if (eventType === 'COLD_CHAIN_TELEMETRY') {
    const { shipmentId, sensorId, recordedTempC, maxAllowedTempC, durationMins, batchUnits } = data;

    if (recordedTempC > maxAllowedTempC && durationMins >= 30) {
      triggered = true;
      domain = 'LOGISTICS';
      type = 'COLD_CHAIN_BREACH';
      deficitUnitsForBFS = batchUnits;
      severity = 'CRITICAL';
      directLoss = batchUnits * product.unitCost; // Spoiled thermal-sensitive cells
      metadata = {
        shipmentId,
        sensorId,
        recordedTempC,
        maxAllowedTempC,
        durationMins,
        compromisedUnits: batchUnits
      };
      auditMessage = `IoT Sensor ${sensorId} recorded ${recordedTempC}°C (max ${maxAllowedTempC}°C) for ${durationMins} mins.`;
    }
  }

  // 5. THREE_WAY_MATCH_FAIL (FINANCE)
  else if (eventType === 'INVOICE_RECEIVED') {
    const { invoiceNumber, poNumber, poUnitPrice, invoiceUnitPrice, receivedQty, billedQty } = data;
    const priceVariance = (invoiceUnitPrice - poUnitPrice) * billedQty;
    const qtyVariance = (billedQty - receivedQty) * invoiceUnitPrice;
    const totalOvercharge = Math.max(0, Number((priceVariance + qtyVariance).toFixed(2)));

    if (totalOvercharge > 50) {
      triggered = true;
      domain = 'FINANCE';
      type = 'THREE_WAY_MATCH_FAIL';
      deficitUnitsForBFS = Math.max(0, receivedQty - billedQty);
      severity = totalOvercharge > 5000 ? 'CRITICAL' : 'MEDIUM';
      directLoss = totalOvercharge;
      metadata = {
        invoiceNumber,
        poNumber,
        poUnitPrice,
        invoiceUnitPrice,
        receivedQty,
        billedQty,
        overchargeAmount: totalOvercharge
      };
      auditMessage = `3-Way Match failed on ${invoiceNumber}: Vendor overcharged by $${totalOvercharge}.`;
    }
  }

  if (!triggered) return null;

  const { blastRadiusTree, totalBlastRadiusRevenueAtRisk } = await calculateBlastRadiusBFS(
    sku,
    deficitUnitsForBFS
  );

  const severityWeight = severity === 'CRITICAL' ? 2.0 : severity === 'HIGH' ? 1.5 : 1.0;
  const priorityScore = Math.round(
    (directLoss + totalBlastRadiusRevenueAtRisk) * severityWeight
  );

  const recommendedActions = product.backupSuppliers.map((sup) => ({
    actionId: `ACT-${sup.supplierId}`,
    label: `Allocate ${deficitUnitsForBFS || 200} units from ${sup.supplierName} (${sup.leadTimeDays}d SLA)`,
    supplierId: sup.supplierId,
    orderQuantity: deficitUnitsForBFS || 200,
    estimatedCost: (deficitUnitsForBFS || 200) * sup.unitCost
  }));

  if (type === 'THREE_WAY_MATCH_FAIL') {
    recommendedActions.push({
      actionId: 'ACT-HOLD-INVOICE',
      label: `Block Invoice ${metadata.invoiceNumber} & Auto-Issue Debit Note`,
      supplierId: '',
      orderQuantity: 0,
      estimatedCost: 0
    });
  }

  const exceptionDoc = await Exception.create({
    exceptionCode: `EXC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`,
    domain,
    type,
    severity,
    status: 'OPEN',
    rootSku: sku,
    directLoss,
    totalBlastRadiusRevenueAtRisk,
    priorityScore,
    metadata,
    blastRadiusTree,
    recommendedActions,
    auditTimeline: [
      {
        action: auditMessage,
        actor: 'SYSTEM_BFS_ENGINE',
        timestamp: new Date()
      }
    ]
  });

  if (io) {
    io.emit('exception:created', exceptionDoc);
  }

  return exceptionDoc;
}