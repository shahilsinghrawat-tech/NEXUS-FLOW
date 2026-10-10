// File: backend/src/seed.ts
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Exception } from './models/Exception.js';

async function seedSupplyChainGraph() {
  await connectDB();
  console.log('[Seeder] Wiping old data...');
  await Product.deleteMany({});
  await Exception.deleteMany({});

  // 1. SEED 12 GRAPH PRODUCTS & SUPPLIERS
  const products = [
    // --- TIER 2: RAW MATERIALS ---
    {
      sku: 'SKU-CHIP-STM32', name: 'ARM Cortex MCU', tier: 2, category: 'Semiconductors',
      currentStock: 900, inTransitStock: 200, safetyStock: 500, dailyDemand: 120, unitCost: 8, unitRevenue: 15,
      dependentProducts: [{ childSku: 'SKU-ASM-FLIGHTCTRL', quantityRequired: 2 }, { childSku: 'SKU-ASM-BMS', quantityRequired: 1 }],
      backupSuppliers: [{ supplierId: 'SUP-TAIWAN-01', supplierName: 'Taiwan Semi Express', leadTimeDays: 3, unitCost: 11, availableQuota: 5000 }]
    },
    {
      sku: 'SKU-CELL-LIPO', name: 'High-Density LiPo Cell', tier: 2, category: 'Raw Energy',
      currentStock: 1500, inTransitStock: 0, safetyStock: 600, dailyDemand: 150, unitCost: 12, unitRevenue: 22,
      dependentProducts: [{ childSku: 'SKU-ASM-BMS', quantityRequired: 4 }],
      backupSuppliers: [{ supplierId: 'SUP-ENERGY-09', supplierName: 'VoltCore Pune Labs', leadTimeDays: 2, unitCost: 15, availableQuota: 4000 }]
    },
    {
      sku: 'SKU-OPTIC-LENS', name: '4K Thermal Lens', tier: 2, category: 'Optics',
      currentStock: 120, inTransitStock: 50, safetyStock: 80, dailyDemand: 15, unitCost: 140, unitRevenue: 200,
      dependentProducts: [{ childSku: 'SKU-ASM-GIMBAL', quantityRequired: 1 }],
      backupSuppliers: [{ supplierId: 'SUP-OPTICS-JP', supplierName: 'Tokyo Vision Corp', leadTimeDays: 5, unitCost: 165, availableQuota: 300 }]
    },
    {
      sku: 'SKU-MOTOR-BLDC', name: 'Brushless DC Motor', tier: 2, category: 'Propulsion',
      currentStock: 800, inTransitStock: 400, safetyStock: 600, dailyDemand: 100, unitCost: 22, unitRevenue: 45,
      dependentProducts: [{ childSku: 'SKU-DRONE-AGRI', quantityRequired: 6 }, { childSku: 'SKU-DRONE-DEFENSE', quantityRequired: 4 }],
      backupSuppliers: [{ supplierId: 'SUP-MOTOR-IN', supplierName: 'Titan Motors Chennai', leadTimeDays: 1, unitCost: 25, availableQuota: 10000 }]
    },

    // --- TIER 1: SUB-ASSEMBLIES ---
    {
      sku: 'SKU-ASM-FLIGHTCTRL', name: 'Autonomous Flight Controller', tier: 1, category: 'Avionics',
      currentStock: 350, inTransitStock: 100, safetyStock: 150, dailyDemand: 40, unitCost: 65, unitRevenue: 110,
      dependentProducts: [{ childSku: 'SKU-DRONE-AGRI', quantityRequired: 1 }, { childSku: 'SKU-DRONE-DEFENSE', quantityRequired: 2 }],
      backupSuppliers: []
    },
    {
      sku: 'SKU-ASM-BMS', name: 'Smart 4S BMS Pack', tier: 1, category: 'Power',
      currentStock: 420, inTransitStock: 80, safetyStock: 180, dailyDemand: 45, unitCost: 90, unitRevenue: 145,
      dependentProducts: [{ childSku: 'SKU-DRONE-AGRI', quantityRequired: 1 }, { childSku: 'SKU-DRONE-DEFENSE', quantityRequired: 1 }],
      backupSuppliers: []
    },
    {
      sku: 'SKU-ASM-GIMBAL', name: '3-Axis Stabilization Gimbal', tier: 1, category: 'Optics',
      currentStock: 65, inTransitStock: 10, safetyStock: 40, dailyDemand: 12, unitCost: 280, unitRevenue: 400,
      dependentProducts: [{ childSku: 'SKU-DRONE-DEFENSE', quantityRequired: 1 }, { childSku: 'SKU-DRONE-CINEMA', quantityRequired: 1 }],
      backupSuppliers: []
    },

    // --- TIER 0: FINISHED GOODS ---
    {
      sku: 'SKU-DRONE-AGRI', name: 'KisanAir Crop Sprayer (Hexacopter)', tier: 0, category: 'Finished Goods',
      currentStock: 85, inTransitStock: 20, safetyStock: 40, dailyDemand: 12, unitCost: 850, unitRevenue: 1400,
      dependentProducts: [], backupSuppliers: []
    },
    {
      sku: 'SKU-DRONE-DEFENSE', name: 'Sentinel-X Recon Drone (Quad)', tier: 0, category: 'Finished Goods',
      currentStock: 45, inTransitStock: 10, safetyStock: 25, dailyDemand: 6, unitCost: 1800, unitRevenue: 3200,
      dependentProducts: [], backupSuppliers: []
    },
    {
      sku: 'SKU-DRONE-CINEMA', name: 'AeroFilm Pro 8K', tier: 0, category: 'Finished Goods',
      currentStock: 15, inTransitStock: 5, safetyStock: 10, dailyDemand: 2, unitCost: 2200, unitRevenue: 4500,
      dependentProducts: [], backupSuppliers: []
    }
  ];
  await Product.insertMany(products);

  // 2. SEED PAST & PRESENT INCIDENTS (HISTORY)
  const exceptions = [
    {
      exceptionCode: 'EXC-88192-A', domain: 'LOGISTICS', type: 'COLD_CHAIN_BREACH', severity: 'CRITICAL', status: 'RESOLVED',
      rootSku: 'SKU-CELL-LIPO', directLoss: 12000, totalBlastRadiusRevenueAtRisk: 0, priorityScore: 24000,
      metadata: { shipmentId: 'SHP-9921', recordedTempC: 32, maxAllowedTempC: 25, compromisedUnits: 1000 },
      blastRadiusTree: [], recommendedActions: [],
      auditTimeline: [
        { action: 'IoT Sensor detected 32°C for 45 mins.', actor: 'SYSTEM', timestamp: new Date(Date.now() - 86400000 * 2) },
        { action: 'Resolved via action: Quarantine Batch & File Carrier Claim', actor: 'Kush (Supply Planner)', timestamp: new Date(Date.now() - 86400000) }
      ]
    },
    {
      exceptionCode: 'EXC-99214-B', domain: 'PROCUREMENT', type: 'QUALITY_HOLD', severity: 'HIGH', status: 'RESOLVED',
      rootSku: 'SKU-OPTIC-LENS', directLoss: 4200, totalBlastRadiusRevenueAtRisk: 0, priorityScore: 8400,
      metadata: { poNumber: 'PO-77312', defectRatePercent: 4.2, quarantinedUnits: 30 },
      blastRadiusTree: [], recommendedActions: [],
      auditTimeline: [
        { action: 'Batch PO-77312 quarantined: 4.2% defect rate.', actor: 'SYSTEM', timestamp: new Date(Date.now() - 43200000) },
        { action: 'Resolved via action: RTV (Return to Vendor) Initiated', actor: 'Kush (Supply Planner)', timestamp: new Date(Date.now() - 36000000) }
      ]
    }
  ];
  await Exception.insertMany(exceptions);

  console.log('[Seeder] Database enriched with 10 Products, 4 Suppliers, and 2 Historical Incidents!');
  process.exit(0);
}
seedSupplyChainGraph();
