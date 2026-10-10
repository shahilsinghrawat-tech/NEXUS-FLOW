// File: frontend/src/app/inventory/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Database, Truck, AlertOctagon } from 'lucide-react';

export default function InventoryDashboard() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/products').then((res) => setProducts(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">Global Inventory & Suppliers</h2>
        <p className="text-slate-400">Live stock health, Bill of Materials (BOM), and backup supplier quotas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map((prod) => {
          const totalStock = prod.currentStock + prod.inTransitStock;
          const isHealthy = totalStock > (prod.safetyStock + prod.dailyDemand * 7);
          const healthPercent = Math.min(100, (totalStock / (prod.safetyStock * 2)) * 100);

          return (
            <div key={prod._id} className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-lg">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">Tier {prod.tier}</span>
                    <h3 className="text-lg font-bold text-white">{prod.name}</h3>
                  </div>
                  <p className="text-sm font-mono text-indigo-400">{prod.sku}</p>
                </div>
                {isHealthy ? (
                  <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Database className="w-5 h-5" /></span>
                ) : (
                  <span className="p-2 bg-red-500/10 text-red-400 rounded-lg"><AlertOctagon className="w-5 h-5" /></span>
                )}
              </div>

              {/* Stock Health Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Current + Transit: <strong>{totalStock}</strong> units</span>
                  <span>Safety Stock: <strong>{prod.safetyStock}</strong></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} 
                    style={{ width: `${healthPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Backup Suppliers */}
              {prod.backupSuppliers.length > 0 && (
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Backup Suppliers</h4>
                  <div className="space-y-2">
                    {prod.backupSuppliers.map((sup: any) => (
                      <div key={sup.supplierId} className="flex justify-between items-center text-sm bg-[#0f172a] p-2.5 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300 font-medium">{sup.supplierName}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-slate-400 text-xs">Quota Left</span>
                          <span className="font-mono text-emerald-400 font-bold">{sup.availableQuota.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}