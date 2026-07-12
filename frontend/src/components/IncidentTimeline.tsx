"use client";
import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Activity, Cpu, ShieldAlert, ArrowDown } from 'lucide-react';

export default function IncidentTimeline({ incident }: { incident: any }) {
    if (!incident) return null;

    const getIcon = (type: string) => {
        if (type.includes("CAN")) return <Cpu size={16} className="text-blue-500"/>;
        if (type.includes("Anomaly") || type.includes("Pattern")) return <Activity size={16} className="text-orange-500"/>;
        return <AlertTriangle size={16} className="text-yellow-500"/>;
    };

    return (
        <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-500" /> Forensic Incident Timeline
            </h2>
            
            <div className="bg-[#020617] p-4 rounded border border-[#1e293b]">
                <div className="mb-4 pb-4 border-b border-[#1e293b]">
                    <h3 className="text-red-400 font-medium text-lg">{incident.incident_id}</h3>
                    <p className="text-sm text-slate-400 mt-1">Vehicle: {incident.vehicle_id} | Root Cause: <span className="text-slate-200">{incident.root_cause}</span></p>
                </div>

                <div className="space-y-4 pl-2 border-l-2 border-[#1e293b] ml-2">
                    {incident.related_events.map((evt: any, i: number) => (
                        <div key={i} className="relative pl-6">
                            <div className="absolute -left-[27px] bg-[#020617] p-1 rounded-full border border-[#1e293b]">
                                {getIcon(evt.event_type)}
                            </div>
                            <span className="text-xs text-slate-500 font-mono block mb-1">{format(new Date(evt.timestamp), 'HH:mm:ss.SSS')}</span>
                            <p className="text-sm text-slate-200 font-medium">{evt.event_type}</p>
                            {evt.details && evt.details.details && (
                                <p className="text-xs text-slate-400 mt-1">{evt.details.details}</p>
                            )}
                            {evt.details && evt.details.explanation && (
                                <p className="text-xs text-indigo-400 mt-1 italic">{evt.details.explanation}</p>
                            )}
                        </div>
                    ))}
                    
                    <div className="relative pl-6 pt-4 mt-4 border-t border-[#1e293b] border-dashed">
                         <div className="absolute -left-[27px] top-4 bg-red-900/20 p-1 rounded-full border border-red-900/50">
                            <ShieldAlert size={16} className="text-red-500"/>
                        </div>
                        <p className="text-sm text-red-400 font-medium">Critical Incident Declared</p>
                        <div className="mt-2 p-3 bg-blue-950/20 border border-blue-900/30 rounded">
                            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Recommended Response</p>
                            <p className="text-sm text-slate-300">{incident.recommended_action}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
