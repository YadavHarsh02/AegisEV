"use client";

import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, ShieldAlert, Cpu, Zap, Thermometer, Shield, ShieldCheck, ArrowRight, ServerCrash } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const WS_URL = "ws://localhost:8000/ws";

export default function Dashboard() {
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [canTraffic, setCanTraffic] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [riskScores, setRiskScores] = useState<Record<string, any>>({});
  
  const { lastJsonMessage: telemetryMsg } = useWebSocket(`${WS_URL}/telemetry`, { shouldReconnect: () => true });
  const { lastJsonMessage: alertMsg } = useWebSocket(`${WS_URL}/alerts`, { shouldReconnect: () => true });
  const { lastJsonMessage: threatMsg } = useWebSocket(`${WS_URL}/threats`, { shouldReconnect: () => true });
  const { lastJsonMessage: anomalyMsg } = useWebSocket(`${WS_URL}/anomalies`, { shouldReconnect: () => true });
  const { lastJsonMessage: canMsg } = useWebSocket(`${WS_URL}/can_traffic`, { shouldReconnect: () => true });
  const { lastJsonMessage: riskMsg } = useWebSocket(`${WS_URL}/risk`, { shouldReconnect: () => true });
  const { lastJsonMessage: incidentMsg } = useWebSocket(`${WS_URL}/incidents`, { shouldReconnect: () => true });

  useEffect(() => {
    if (telemetryMsg) {
      setTelemetryHistory(prev => [...prev, telemetryMsg].slice(-50));
    }
  }, [telemetryMsg]);

  useEffect(() => {
    if (alertMsg) setAlerts(prev => [alertMsg, ...prev].slice(0, 20));
  }, [alertMsg]);

  useEffect(() => {
    if (threatMsg) setThreats(prev => [threatMsg, ...prev].slice(0, 20));
  }, [threatMsg]);

  useEffect(() => {
    if (anomalyMsg) setAnomalies(prev => [anomalyMsg, ...prev].slice(0, 20));
  }, [anomalyMsg]);

  useEffect(() => {
    if (canMsg) setCanTraffic(prev => [canMsg, ...prev].slice(0, 50));
  }, [canMsg]);

  useEffect(() => {
    if (riskMsg) {
      const data: any = riskMsg;
      setRiskScores(prev => ({ ...prev, [data.vehicle_id]: data }));
    }
  }, [riskMsg]);

  useEffect(() => {
    if (incidentMsg) {
        const inc: any = incidentMsg;
        setIncidents(prev => {
            const filtered = prev.filter(i => i.incident_id !== inc.incident_id);
            return [inc, ...filtered].slice(0, 20);
        });
    }
  }, [incidentMsg]);

  const handleStartSim = () => fetch('http://localhost:8000/api/simulator/start', { method: 'POST' });
  const handleStopSim = () => fetch('http://localhost:8000/api/simulator/stop', { method: 'POST' });
  
  const triggerAttack = (type: string) => {
    fetch('http://localhost:8000/api/attack/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attack_type: type, duration: 10 })
    });
  };

  const getRiskColor = (classification: string) => {
    if (classification === 'Critical') return 'text-red-500';
    if (classification === 'High Risk') return 'text-orange-500';
    if (classification === 'Elevated') return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];

  return (
     <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800">
           <button onClick={handleStartSim} className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 rounded text-sm font-medium transition-colors">Start Simulator</button>
           <button onClick={handleStopSim} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-sm font-medium transition-colors">Stop Simulator</button>
           <div className="hidden md:block w-px bg-slate-800 mx-2"></div>
           <button onClick={() => triggerAttack('spoofing')} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded text-sm font-medium transition-colors">Inject CAN Spoof</button>
           <button onClick={() => triggerAttack('flood')} className="px-4 py-2 bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 border border-orange-800/50 rounded text-sm font-medium transition-colors">CAN Flood Attack</button>
           <button onClick={() => triggerAttack('replay')} className="px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-800/50 rounded text-sm font-medium transition-colors">Replay Attack</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Active Threats</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{threats.length}</p>
                </div>
                <div className="p-3 bg-red-950/30 rounded-lg text-red-500">
                    <ShieldAlert size={24} />
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">AI Anomalies</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">{anomalies.length}</p>
                </div>
                <div className="p-3 bg-orange-950/30 rounded-lg text-orange-500">
                    <Activity size={24} />
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Security Alerts</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{alerts.length}</p>
                </div>
                <div className="p-3 bg-yellow-950/30 rounded-lg text-yellow-500">
                    <AlertTriangle size={24} />
                </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Vehicles Monitored</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{Object.keys(riskScores).length || (latestTelemetry ? 10 : 0)}</p>
                </div>
                <div className="p-3 bg-blue-950/30 rounded-lg text-blue-500">
                    <ShieldCheck size={24} />
                </div>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Incidents (Correlated) */}
            <div className="lg:col-span-2 bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ServerCrash size={20} className="text-red-500" /> Active Security Incidents</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {incidents.map((inc: any, i: number) => (
                        <div key={i} className="p-4 bg-[#020617] border border-red-900/50 rounded-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-red-400">{inc.incident_id}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Root Cause: <span className="text-slate-200">{inc.root_cause}</span></p>
                                </div>
                                <div className="text-right">
                                    <Link href={`/vehicle/${inc.vehicle_id}`} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                                        Investigate <ArrowRight size={14} />
                                    </Link>
                                    <p className="text-xs text-slate-500 mt-1">{format(new Date(inc.start_time), 'HH:mm:ss')}</p>
                                </div>
                            </div>
                            <div className="bg-red-950/20 p-3 rounded mt-3 border border-red-900/30">
                                <p className="text-xs text-red-400 uppercase tracking-wider mb-1 font-medium">Recommended Action</p>
                                <p className="text-sm text-slate-300">{inc.recommended_action}</p>
                            </div>
                        </div>
                    ))}
                    {incidents.length === 0 && (
                        <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                            <ShieldCheck size={32} className="text-emerald-500 mb-2 opacity-50" />
                            No Active Incidents
                        </div>
                    )}
                </div>
            </div>

            {/* Risk Scores */}
            <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Shield size={20} className="text-indigo-500" /> Fleet Risk Scores</h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {Object.values(riskScores).sort((a, b) => b.score - a.score).map((risk: any, i: number) => (
                        <Link href={`/vehicle/${risk.vehicle_id}`} key={i} className="block hover:bg-[#1e293b]/50 transition-colors">
                            <div className="flex justify-between items-center p-3 bg-[#020617] rounded-lg border border-[#1e293b]/50">
                                <div>
                                    <p className="font-medium text-slate-200">{risk.vehicle_id}</p>
                                    <p className={`text-xs ${getRiskColor(risk.classification)}`}>{risk.classification}</p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <p className={`text-xl font-bold ${getRiskColor(risk.classification)}`}>{risk.score}</p>
                                    <ArrowRight size={16} className="text-slate-600" />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {Object.keys(riskScores).length === 0 && (
                        <div className="text-center text-slate-500 py-8">Waiting for telemetry...</div>
                    )}
                </div>
            </div>
        </div>

        {/* Telemetry Chart & AI Explanations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-[#0f172a] p-4 rounded-lg border border-[#1e293b] min-h-[400px]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Zap size={20} className="text-blue-500" /> Live Fleet Telemetry</h2>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={telemetryHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => t ? format(new Date(t), 'HH:mm:ss') : ''} />
                            <YAxis yAxisId="left" stroke="#3b82f6" domain={[300, 450]} />
                            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={[-100, 200]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                labelFormatter={(t) => t ? format(new Date(t), 'HH:mm:ss') : ''}
                            />
                            <Line yAxisId="left" type="monotone" dataKey="battery_voltage" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                            <Line yAxisId="right" type="monotone" dataKey="battery_current" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk Scores */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Shield size={20} className="text-indigo-500" /> Fleet Risk Scores</h2>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                    {Object.values(riskScores).sort((a, b) => b.score - a.score).map((risk: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                            <div>
                                <p className="font-medium text-slate-200">{risk.vehicle_id}</p>
                                <p className={`text-xs ${getRiskColor(risk.classification)}`}>{risk.classification}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-bold ${getRiskColor(risk.classification)}`}>{risk.score}</p>
                            </div>
                        </div>
                    ))}
                    {Object.keys(riskScores).length === 0 && (
                        <div className="text-center text-slate-500 py-8">Waiting for telemetry...</div>
                    )}
                </div>
            </div>
        </div>

        {/* Security Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Events */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ShieldAlert size={20} className="text-red-500" /> Intrusion Detection (IDS)</h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {threats.map((threat: any, i: number) => (
                        <div key={i} className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-red-400">{threat.threat_type}</p>
                                <span className="text-xs text-slate-400">{format(new Date(threat.timestamp), 'HH:mm:ss')}</span>
                            </div>
                            <p className="text-sm text-slate-300 mt-1">{threat.details}</p>
                            <p className="text-xs text-slate-500 mt-2">Vehicle: {threat.vehicle_id} | Risk: <span className="text-red-400">{threat.risk_level}</span></p>
                        </div>
                    ))}
                    {threats.length === 0 && <div className="text-center text-slate-500 py-8">No threats detected</div>}
                </div>
            </div>

            {/* AI Anomalies */}
            <div className="bg-[#0f172a] p-4 rounded-lg border border-[#1e293b]">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity size={20} className="text-orange-500" /> AI Explainability Engine</h2>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {anomalies.map((anomaly: any, i: number) => (
                        <div key={i} className="p-3 bg-[#020617] border border-orange-900/30 rounded-lg">
                            <div className="flex justify-between items-start border-b border-[#1e293b] pb-2 mb-2">
                                <Link href={`/vehicle/${anomaly.vehicle_id}`} className="font-medium text-orange-400 hover:text-orange-300">
                                    {anomaly.vehicle_id}
                                </Link>
                                <span className="text-xs text-slate-400">{format(new Date(anomaly.timestamp), 'HH:mm:ss')}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-200 mb-1">{anomaly.anomaly_type}</p>
                            <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/50 pl-2">"{anomaly.explanation}"</p>
                            <div className="flex gap-4 mt-3 pt-2 border-t border-[#1e293b]">
                                <p className="text-xs text-slate-500">Confidence: <span className="text-orange-400">{anomaly.confidence_score}%</span></p>
                            </div>
                        </div>
                    ))}
                    {anomalies.length === 0 && <div className="text-center text-slate-500 py-8">No anomalies detected</div>}
                </div>
            </div>
        </div>
            
            {/* CAN Traffic Stream (Optional for bottom, taking full width) */}
            <div className="lg:col-span-2 bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={20} className="text-purple-500" /> Live CAN Bus Packet Filter (Sampled)</h2>
                <div className="bg-slate-950 rounded-lg p-3 overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-2">Time</th>
                                <th className="px-4 py-2">Vehicle</th>
                                <th className="px-4 py-2">ECU</th>
                                <th className="px-4 py-2">CAN ID</th>
                                <th className="px-4 py-2">Payload</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canTraffic.slice(0, 10).map((msg: any, i: number) => (
                                <tr key={i} className={`border-b border-slate-800 ${msg.is_attack ? 'bg-red-950/10' : ''}`}>
                                    <td className="px-4 py-2 font-mono text-xs">{format(new Date(msg.timestamp), 'HH:mm:ss.SSS')}</td>
                                    <td className="px-4 py-2">{msg.vehicle_id}</td>
                                    <td className="px-4 py-2 font-mono">{msg.source_ecu}</td>
                                    <td className="px-4 py-2 font-mono text-blue-400">{msg.can_id}</td>
                                    <td className="px-4 py-2 font-mono text-slate-400">{msg.payload}</td>
                                    <td className="px-4 py-2">
                                        {msg.is_attack ? (
                                            <span className="bg-red-900/50 text-red-400 px-2 py-0.5 rounded text-xs border border-red-800">SUSPICIOUS</span>
                                        ) : (
                                            <span className="bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-800">OK</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {canTraffic.length === 0 && <div className="text-center text-slate-500 py-4">Waiting for CAN traffic...</div>}
                </div>
        </div>
     </div>
  );
}
