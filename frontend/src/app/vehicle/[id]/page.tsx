"use client";

import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import BatteryIntelligence from '@/components/BatteryIntelligence';
import CellVisualization from '@/components/CellVisualization';
import IncidentTimeline from '@/components/IncidentTimeline';
import TopologyView from '@/components/TopologyView';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VehicleInvestigation({ params }: { params: { id: string } }) {
    const [profile, setProfile] = useState<any>(null);
    const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const WS_URL = API_URL.replace(/^http/, 'ws') + "/ws";
    
    const { lastJsonMessage: telemetryMsg } = useWebSocket(`${WS_URL}/telemetry`, { shouldReconnect: () => true });
    
    useEffect(() => {
        fetch(`${API_URL}/api/vehicle/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                setLiveTelemetry(data.latest_telemetry);
            });
    }, [params.id]);

    useEffect(() => {
        if (telemetryMsg && (telemetryMsg as any).vehicle_id === params.id) {
            setLiveTelemetry(telemetryMsg);
        }
    }, [telemetryMsg]);

    if (!profile) return <div className="p-8 text-white">Loading Investigation Console...</div>;

    const activeThreats = profile.alerts.filter((a: any) => new Date().getTime() - new Date(a.timestamp).getTime() < 300000);

    return (
        <main className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex items-center gap-4 border-b border-[#1e293b] pb-4">
                    <Link href="/" className="p-2 hover:bg-[#1e293b] rounded transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            Vehicle Investigation: <span className="text-blue-500">{params.id}</span>
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">Deep forensic view and live telemetry monitoring</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <TopologyView activeThreats={activeThreats} />
                        <BatteryIntelligence telemetry={liveTelemetry} />
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <CellVisualization 
                            cellVoltages={liveTelemetry?.cell_voltages} 
                            cellTemperatures={liveTelemetry?.cell_temperatures} 
                        />
                        {profile.incidents.length > 0 ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white px-2">Incident History</h3>
                                {profile.incidents.map((inc: any, i: number) => (
                                    <IncidentTimeline key={i} incident={inc} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#0f172a] p-8 text-center text-slate-500 rounded-lg border border-[#1e293b]">
                                No security incidents recorded for this vehicle.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
