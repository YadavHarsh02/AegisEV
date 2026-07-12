"use client";
import React from 'react';
import { Cloud, Radio, Cpu, Battery, Car } from 'lucide-react';

export default function TopologyView({ activeThreats }: { activeThreats: any[] }) {
    
    // Determine which components are under attack based on recent threats
    const compromised = new Set<string>();
    
    activeThreats?.forEach(t => {
        if (t.threat_type.includes("CAN")) {
            compromised.add("gateway");
            compromised.add("can_bus");
        }
        if (t.threat_type.includes("Temperature") || t.threat_type.includes("Voltage")) {
            compromised.add("bms");
            compromised.add("battery");
        }
    });

    const Node = ({ id, label, icon: Icon }: any) => {
        const isAlert = compromised.has(id);
        const bgColor = isAlert ? 'bg-red-950/40' : 'bg-[#0f172a]';
        const borderColor = isAlert ? 'border-red-500/50' : 'border-[#1e293b]';
        const textColor = isAlert ? 'text-red-400' : 'text-slate-300';
        const iconColor = isAlert ? 'text-red-500' : 'text-blue-500';

        return (
            <div className={`flex flex-col items-center justify-center p-3 w-28 rounded-lg border ${bgColor} ${borderColor} transition-colors`}>
                <Icon size={24} className={`${iconColor} mb-2`} />
                <span className={`text-xs font-medium text-center ${textColor}`}>{label}</span>
            </div>
        );
    };

    return (
        <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
            <h2 className="text-lg font-semibold text-white mb-6">Vehicle Topology Architecture</h2>
            
            <div className="flex flex-col items-center space-y-4">
                <Node id="cloud" label="OEM Cloud" icon={Cloud} />
                <div className={`w-0.5 h-6 ${compromised.has("gateway") ? 'bg-red-500/50' : 'bg-[#1e293b]'}`}></div>
                <Node id="gateway" label="Telemetry Gateway" icon={Radio} />
                <div className={`w-0.5 h-6 ${compromised.has("can_bus") ? 'bg-red-500/50' : 'bg-[#1e293b]'}`}></div>
                
                <div className={`w-64 h-8 border-t-2 border-l-2 border-r-2 rounded-t-lg ${compromised.has("can_bus") ? 'border-red-500/50' : 'border-[#1e293b]'}`}></div>
                
                <div className="flex justify-center gap-4 -mt-4 w-full">
                    <div className="flex flex-col items-center">
                        <Node id="vcu" label="VCU" icon={Cpu} />
                    </div>
                    <div className="flex flex-col items-center">
                        <Node id="bms" label="BMS" icon={Battery} />
                        <div className={`w-0.5 h-6 ${compromised.has("battery") ? 'bg-red-500/50' : 'bg-[#1e293b]'}`}></div>
                        <Node id="battery" label="Battery Pack" icon={Battery} />
                    </div>
                    <div className="flex flex-col items-center">
                        <Node id="motor" label="Inverter" icon={Car} />
                    </div>
                </div>
            </div>
        </div>
    );
}
