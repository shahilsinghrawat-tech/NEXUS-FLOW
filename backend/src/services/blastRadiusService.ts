import { Product, IProduct } from '../models/Product.js';
import { IBlastRadiusNode } from '../models/Exception.js';

interface QueueItem {
    sku: string;
    deficitUnits: number;
}

export interface BlastRadiusResult {
    blastRadiusTree: IBlastRadiusNode[];
    totalBlastRadiusRevenueAtRisk: number;
}

export async function calculateBlastRadiusBFS(
    rootSku: string,
    initialDeficitUnits: number
): Promise<BlastRadiusResult> {
    if (initialDeficitUnits <= 0) {
        return { blastRadiusTree: [], totalBlastRadiusRevenueAtRisk: 0 };
    }

    const allProducts = await Product.find({}).lean<IProduct[]>();
    const productMap = new Map<string, IProduct>();
    for (const prod of allProducts) {
        productMap.set(prod.sku, prod);
    }

    const impactedMap = new Map<string, IBlastRadiusNode>();

    const queue: QueueItem[] = [{ sku: rootSku, deficitUnits: initialDeficitUnits }];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const parentNode = productMap.get(current.sku);

        if (!parentNode || !parentNode.dependentProducts) continue;

        for (const edge of parentNode.dependentProducts) {
            const childNode = productMap.get(edge.childSku);
            if (!childNode) continue;

            // If 2 chips are needed per 1 board, a deficit of 400 chips blocks 200 boards - concept yeh he

            const childBlockedUnits = Math.max(
                1,
                Math.floor(current.deficitUnits / edge.quantityRequired)
            );
            const childRevenueRisk = childBlockedUnits * childNode.unitRevenue;

            const existingImpact = impactedMap.get(childNode.sku);

            if (!existingImpact || childBlockedUnits > existingImpact.impactedUnits) {
                impactedMap.set(childNode.sku, {
                    sku: childNode.sku,
                    name: childNode.name,
                    tier: childNode.tier,
                    impactedUnits: childBlockedUnits,
                    revenueAtRisk: childRevenueRisk
                });

                queue.push({
                    sku: childNode.sku,
                    deficitUnits: childBlockedUnits
                });
            }
        }

    }

    const blastRadiusTree = Array.from(impactedMap.values()).sort(
        (a, b) => a.tier - b.tier 
    );

    const totalBlastRadiusRevenueAtRisk = blastRadiusTree.reduce(
        (sum, node) => sum + node.revenueAtRisk,
        0
    );

    return { blastRadiusTree, totalBlastRadiusRevenueAtRisk };

}