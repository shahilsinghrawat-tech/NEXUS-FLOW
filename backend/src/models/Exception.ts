import mongoose, { Schema, Document } from 'mongoose';

export interface IBlastRadiusNode {
  sku: string;
  name: string;
  tier: number;
  impactedUnits: number;
  revenueAtRisk: number;
}

export interface IRecommendedAction {
  actionId: string;
  label: string;
  supplierId?: string;
  orderQuantity?: number;
  estimatedCost: number;
}

export interface IAuditLog {
  action: string;
  actor: string;
  timestamp: Date;
}

export interface IException extends Document {
  exceptionCode: string;
  domain: 'INVENTORY' | 'PROCUREMENT' | 'LOGISTICS' | 'FINANCE';
  type: 'SHORTAGE_RISK' | 'THREE_WAY_MATCH_FAIL' | 'QUALITY_HOLD' | 'COLD_CHAIN_BREACH' | 'LATE_SHIPMENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  rootSku: string;
  directLoss: number;
  totalBlastRadiusRevenueAtRisk: number;
  priorityScore: number;
  metadata: Record<string, any>;
  blastRadiusTree: IBlastRadiusNode[];
  recommendedActions: IRecommendedAction[];
  auditTimeline: IAuditLog[];
}

const ExceptionSchema = new Schema<IException>(
  {
    exceptionCode: { type: String, required: true, unique: true, index: true },
    domain: {
      type: String,
      enum: ['INVENTORY', 'PROCUREMENT', 'LOGISTICS', 'FINANCE'],
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['SHORTAGE_RISK', 'THREE_WAY_MATCH_FAIL', 'QUALITY_HOLD', 'COLD_CHAIN_BREACH', 'LATE_SHIPMENT'],
      required: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'RESOLVED'],
      default: 'OPEN',
      index: true
    },
    rootSku: { type: String, required: true, index: true },
    directLoss: { type: Number, required: true, default: 0 },
    totalBlastRadiusRevenueAtRisk: { type: Number, required: true, default: 0 },
    priorityScore: { type: Number, required: true, index: true },

    
    metadata: { type: Schema.Types.Mixed, required: true },

    //output he BFS ka store karna he
    blastRadiusTree: [
      {
        sku: String,
        name: String,
        tier: Number,
        impactedUnits: Number,
        revenueAtRisk: Number
      }
    ],

    recommendedActions: [
      {
        actionId: String,
        label: String,
        supplierId: String,
        orderQuantity: Number,
        estimatedCost: Number
      }
    ],

    auditTimeline: [
      {
        action: String,
        actor: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

ExceptionSchema.index({ status: 1, priorityScore: -1 });

export const Exception = mongoose.model<IException>('Exception', ExceptionSchema);
