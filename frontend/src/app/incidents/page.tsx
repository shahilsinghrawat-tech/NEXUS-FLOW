// File: frontend/src/app/incidents/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function IncidentsHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Fetch ALL exceptions (OPEN and RESOLVED)
    apiClient.get('/exceptions?status=ALL').then((res) => setHistory(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">Incident Audit Log</h2>
        <p className="text-slate-400">Historical record of all supply chain disruptions and resolutions.</p>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 font-medium">Incident ID</th>
              <th className="px-6 py-4 font-medium">Domain & Type</th>
              <th className="px-6 py-4 font-medium">Root SKU</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Financial Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {history.map((exc) => (
              <tr key={exc._id} className="hover:bg-slate-800/50 transition">
                <td className="px-6 py-4 font-mono text-indigo-400">{exc.exceptionCode}</td>
                <td className="px-6 py-4">
                  <span className="block font-bold text-slate-200">{exc.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-500">{exc.domain}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs bg-slate-800/50 rounded">{exc.rootSku}</td>
                <td className="px-6 py-4">
                  {exc.status === 'RESOLVED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" /> Action Required
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-200">
                  ${(exc.directLoss + exc.totalBlastRadiusRevenueAtRisk).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}