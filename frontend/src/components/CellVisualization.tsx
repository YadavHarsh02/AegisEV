"use client";
import React from 'react';

export default function CellVisualization({ cellVoltages, cellTemperatures }: { cellVoltages: number[], cellTemperatures: number[] }) {
    if (!cellVoltages || cellVoltages.length !== 96) return null;

    const avgVol = cellVoltages.reduce((a, b) => a + b, 0) / 96;
    
    // Find max delta for imbalance
    const maxVol = Math.max(...cellVoltages);
    const minVol = Math.min(...cellVoltages);
    const delta = maxVol - minVol;
    const isImbalanced = delta > 0.1;

    return (
        <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">96-Cell Pack Topology</h2>
                {isImbalanced && (
                    <span className="text-xs bg-red-950/50 text-red-400 border border-red-900 px-2 py-1 rounded">
                        Imbalance Detected: {(delta*1000).toFixed(0)}mV
                    </span>
                )}
            </div>

            <div className="grid grid-cols-12 gap-1 mb-4">
                {cellVoltages.map((vol, i) => {
                    const temp = cellTemperatures[i];
                    let bgColor = 'bg-emerald-500/20';
                    let borderColor = 'border-emerald-500/30';
                    
                    if (temp > 45) {
                        bgColor = 'bg-red-500/40';
                        borderColor = 'border-red-500/50';
                    } else if (Math.abs(vol - avgVol) > 0.05) {
                        bgColor = 'bg-orange-500/30';
                        borderColor = 'border-orange-500/40';
                    }

                    return (
                        <div key={i} title={`Cell ${i+1}\nVol: ${vol.toFixed(3)}V\nTemp: ${temp.toFixed(1)}°C`} 
                             className={`aspect-square rounded-[2px] border ${bgColor} ${borderColor} flex items-center justify-center cursor-pointer hover:border-slate-300 transition-colors`}>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex gap-4 text-xs text-slate-400 justify-end">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/20 border border-emerald-500/30 rounded-[1px]"></div> Healthy</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500/30 border border-orange-500/40 rounded-[1px]"></div> Imbalanced</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500/40 border border-red-500/50 rounded-[1px]"></div> Overheated</div>
            </div>
        </div>
    );
}
