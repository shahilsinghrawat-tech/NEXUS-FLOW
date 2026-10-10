import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupSupplier {
    supplierId: string;
    supplierName: string;
    leadTimeDays: number;
    unitCost: number;
    availableQuota: number;
}

export interface IDependentEdge {
  childSku: string;       // Downstream product that depends on this SKU
  quantityRequired: number; // How many units of this SKU are needed per 1 unit of childSku
}

export interface IProduct extends Document {
  sku: string;
  name: string;
  tier: number;           //(For remembering) Tier 2 = Raw Component, Tier 1 = Sub-Assembly, Tier 0 = Finished Good
  category: string;
  currentStock: number;
  inTransitStock: number;
  safetyStock: number;
  dailyDemand: number;
  unitCost: number;
  unitRevenue: number;
  dependentProducts: IDependentEdge[]; // Adjacency list for DAG BFS Traversal
  backupSuppliers: IBackupSupplier[];
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    tier: { type: Number, required: true, enum: [0, 1, 2] },
    category: { type: String, required: true },
    currentStock: { type: Number, required: true, default: 0 },
    inTransitStock: { type: Number, required: true, default: 0 },
    safetyStock: { type: Number, required: true },
    dailyDemand: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    unitRevenue: { type: Number, required: true },

    
    dependentProducts: [
      {
        childSku: { type: String, required: true },
        quantityRequired: { type: Number, required: true, default: 1 }
      }
    ],

    //yeh tested suppliers he
    backupSuppliers: [
      {
        supplierId: { type: String, required: true },
        supplierName: { type: String, required: true },
        leadTimeDays: { type: Number, required: true },
        unitCost: { type: Number, required: true },
        availableQuota: { type: Number, required: true }
      }
    ]
  },
  {
    timestamps: true,
    optimisticConcurrency: true // ye version check ACID Transaction me.
  }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);