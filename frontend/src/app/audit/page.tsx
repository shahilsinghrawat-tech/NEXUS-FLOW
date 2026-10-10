// File: frontend/src/app/audit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Activity, User, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuditLogEntry {
  _id: string; // Unique combination of exception ID + timestamp
  exceptionCode: string;
  type: string;
  action: string;
  actor: string;
  timestamp: string;
}

export default function AuditTrail() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditHistory();
  }, []);

  const fetchAuditHistory = async () => {
    try {
      // Fetch all exceptions (both OPEN and RESOLVED)
      const response = await apiClient.get('/exceptions?status=ALL');
      
      // Flatten the embedded audit timelines into a single master array
      const flatLogs: AuditLogEntry[] = [];
      
      response.data.forEach((exc: any) => {
        exc.auditTimeline.forEach((log: any) => {
          flatLogs.push({
            _id: `${exc._id}-${log.timestamp}`,
            exceptionCode: exc.exceptionCode,
            type: exc.type,
            action: log.action,
            actor: log.actor,
            timestamp: log.timestamp,
          });
        });
      });

      // Sort globally by timestamp (newest first)
      flatLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAuditLogs(flatLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading Audit Trail...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">System Audit Trail</h2>
          <p className="text-slate-400">Chronological, immutable ledger of all system detections and planner actions.</p>
        </div>
        <div className="bg-emerald-500/10 px-4 py-2 rounded-lg text-sm border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Compliance Active
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-8 shadow-xl">
        <div className="relative border-l border-slate-700 ml-4 space-y-8 pb-4">
          
          {auditLogs.map((log) => (
            <div key={log._id} className="relative pl-8">
              {/* Timeline Dot */}
              <div className={`absolute -left-[1.3rem] top-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#1e293b] ${log.actor === 'SYSTEM' ? 'bg-slate-700 text-slate-300' : 'bg-indigo-600 text-white'}`}>
                {log.actor === 'SYSTEM' ? <Activity className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Log Content Card */}
              <div className="bg-[#0f172a] p-5 rounded-lg border border-slate-700/50 shadow-sm transition hover:border-slate-600">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{log.actor}</span>
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {log.exceptionCode}
                    </span>
                    <span className="text-xs text-slate-500">({log.type.replace(/_/g, ' ')})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm flex items-start gap-2 mt-3">
                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  {log.action}
                </p>
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="pl-8 text-slate-500 text-sm">No audit logs found.</div>
          )}
          
        </div>
      </div>
    </div>
  );
}