// File: frontend/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient, getSocket } from '@/lib/api';
import { CheckCircle, Zap, ShieldAlert, Activity, AlertTriangle, FileText, RefreshCw, Clock } from 'lucide-react';

export default function CommandCenter() {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExceptions();
    const socket = getSocket();
    
    socket.on('exception:created', (newException) => {
      setExceptions((prev) => [newException, ...prev].sort((a, b) => b.priorityScore - a.priorityScore));
    });

    socket.on('exception:updated', (updatedException) => {
      setExceptions((prev) => 
        prev.map((exc) => exc._id === updatedException._id ? updatedException : exc)
      );
    });

    return () => {
      socket.off('exception:created');
      socket.off('exception:updated');
    };
  }, []);

  const fetchExceptions = async () => {
    try {
      const response = await apiClient.get('/exceptions');
      setExceptions(response.data);
    } catch (error) {
      console.error('Failed to fetch exceptions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (exceptionId: string, actionId: string) => {
    try {
      await apiClient.post(`/exceptions/${exceptionId}/resolve`, {
        actionId,
        actor: 'Kush (Supply Planner)'
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to resolve exception');
    }
  };

  if (loading) return <div className="text-gray-500 p-8 text-lg animate-pulse">Loading Nexus AI Engine...</div>;

  const openExceptions = exceptions.filter(e => e.status === 'OPEN');
  const criticalCount = openExceptions.filter(e => e.severity === 'CRITICAL').length;
  const highCount = openExceptions.filter(e => e.severity === 'HIGH').length;
  const healthScore = Math.max(0, 100 - (openExceptions.length * 8));
  const pendingDecisions = openExceptions.reduce((acc, exc) => acc + exc.recommendedActions.length, 0);
  const priorityWatchlist = openExceptions.slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 4 KPI Cards (Gemini Floating Surfaces) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Supply Chain Health</span>
            <Activity className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-4xl font-light text-gray-900 dark:text-gray-100">{healthScore}%</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Live dynamic score</p>
        </div>

        <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Incidents</span>
            <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-4xl font-light text-gray-900 dark:text-gray-100">{openExceptions.length}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            <span className="text-red-500 font-medium">{criticalCount} critical</span> · <span className="text-orange-500 font-medium">{highCount} high</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Decisions</span>
            <FileText className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-4xl font-light text-gray-900 dark:text-gray-100">{pendingDecisions}</h3>
          <p className="text-sm text-amber-500 font-medium mt-2">Waiting for approval</p>
        </div>

        <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-6 shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</span>
            <RefreshCw className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <h3 className="text-3xl font-light text-emerald-500">Live</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Socket.io active</p>
        </div>
      </div>

      {/* Main Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Priority Watchlist */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e1f20] rounded-3xl p-8 shadow-sm dark:shadow-none transition-colors flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Priority Watchlist</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Critical bottlenecks sorted by revenue risk.</p>
          </div>
          
          <div className="flex-1 space-y-4">
            {priorityWatchlist.map((exc) => (
              <div key={exc._id} className="bg-[#f8fafd] dark:bg-[#131314] p-5 rounded-2xl transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <ShieldAlert className={`w-5 h-5 ${exc.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`} strokeWidth={1.5} />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">{exc.type.replace(/_/g, ' ')}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Root SKU: <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{exc.rootSku}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">Financial Risk</p>
                    <p className="text-xl font-medium text-red-500">${(exc.directLoss + exc.totalBlastRadiusRevenueAtRisk).toLocaleString()}</p>
                  </div>
                </div>

                {exc.blastRadiusTree.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800/50 text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-800 dark:text-gray-300 font-medium">Impact:</strong> Blocking {exc.blastRadiusTree.length} downstream tiers (Tier {exc.blastRadiusTree[0].tier} - {exc.blastRadiusTree[0].name})
                  </div>
                )}
              </div>
            ))}

            {priorityWatchlist.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500/50" strokeWidth={1} />
                <p className="text-lg text-gray-500 dark:text-gray-400">All systems operational.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white dark:bg-[#1e1f20] rounded-3xl p-8 shadow-sm dark:shadow-none transition-colors overflow-y-auto max-h-[600px]">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Needs Attention</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-1">1-Click Resolutions</p>
          </div>

          <div className="space-y-6">
            {openExceptions.map((exc) => (
              <div key={`feed-${exc._id}`} className="bg-[#f8fafd] dark:bg-[#131314] p-4 rounded-2xl">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${exc.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200">{exc.exceptionCode}</h4>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3"/> Live</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{exc.type.replace(/_/g, ' ')}</p>
                
                {exc.recommendedActions.length > 0 && (
                  <button
                    onClick={() => handleResolve(exc._id, exc.recommendedActions[0].actionId)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    {exc.recommendedActions[0].label}
                  </button>
                )}
              </div>
            ))}
            {openExceptions.length === 0 && (
              <p className="text-base text-gray-500 text-center py-8">No pending actions.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}