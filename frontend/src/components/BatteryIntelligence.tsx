"use client";
import React from 'react';
import { Battery, Activity, Zap, Thermometer, ShieldAlert } from 'lucide-react';

export default function BatteryIntelligence({ telemetry }: { telemetry: any }) {
    if (!telemetry) return <div className="p-4 text-slate-500">Waiting for battery data...</div>;

    const soh = telemetry.state_of_health;
    const isDegraded = soh < 95;
    const isCritical = soh < 80;

    const healthStatus = isCritical ? 'Critical' : isDegraded ? 'Degraded' : 'Healthy';
    const healthColor = isCritical ? 'text-red-500' : isDegraded ? 'text-orange-500' : 'text-emerald-500';

    return (
        <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Battery size={20} className="text-blue-500" /> Battery Intelligence
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#020617] p-3 rounded border border-[#1e293b]">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">State of Health (SOH)</p>
                    <div className="flex items-end justify-between">
                        <span className={`text-2xl font-bold ${healthColor}`}>{soh.toFixed(1)}%</span>
                        <span className={`text-xs px-2 py-0.5 rounded bg-[#1e293b] ${healthColor}`}>{healthStatus}</span>
                    </div>
                </div>
                <div className="bg-[#020617] p-3 rounded border border-[#1e293b]">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Charge Cycles</p>
                    <p className="text-2xl font-bold text-slate-200">{telemetry.charge_cycles}</p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-[#1e293b] pb-2">
                    <span className="text-slate-400 flex items-center gap-2"><Zap size={14}/> Pack Voltage</span>
                    <span className="text-slate-200 font-mono">{telemetry.battery_voltage.toFixed(2)} V</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-[#1e293b] pb-2">
                    <span className="text-slate-400 flex items-center gap-2"><Activity size={14}/> Pack Current</span>
                    <span className="text-slate-200 font-mono">{telemetry.battery_current.toFixed(2)} A</span>
                </div>
                <div className="flex justify-between items-center text-sm pb-2">
                    <span className="text-slate-400 flex items-center gap-2"><Thermometer size={14}/> Avg Temperature</span>
                    <span className="text-slate-200 font-mono">{telemetry.battery_temperature.toFixed(1)} °C</span>
                </div>
            </div>
            
            {isDegraded && (
                <div className="mt-4 p-3 bg-orange-950/20 border border-orange-900/30 rounded flex gap-3 items-start">
                    <ShieldAlert size={16} className="text-orange-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-orange-400 font-medium">Degradation Warning</p>
                        <p className="text-xs text-slate-400 mt-1">SOH has dropped below optimal threshold. Cell internal resistance may be increasing.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
