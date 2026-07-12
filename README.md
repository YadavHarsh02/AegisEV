# AegisEV 🛡️⚡

**AI Powered EV Battery Telemetry Security and Intrusion Detection Platform**

AegisEV is a production grade Electric Vehicle cybersecurity platform designed for automotive Security Operations Center teams. It correlates real time CAN bus telemetry, physics based battery degradation metrics, and network intrusion data to detect, explain, and mitigate cyber physical attacks on EV infrastructure.

![AegisEV Dashboard](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg) *(Screenshot placeholder add your dashboard screenshot here!)*

### Key Features

**Advanced 96 Cell Pack Physics Engine**
Simulates realistic EV battery behavior, tracking state of health, charge cycles, localized voltage imbalances, and thermal drifts across a 96 cell topology.

**AI Driven Incident Correlation**
A sliding window event buffer that intelligently groups related network threats and physical anomalies into unified, actionable security incidents.

**Explainability Engine**
Translates opaque Machine Learning anomaly scores into plain English forensic insights, explaining why an anomaly was flagged and providing immediate remediation steps for engineering teams.

**Deep Investigation Console**
An interactive forensic dashboard for individual vehicles, featuring live pack topology grids and network architecture maps that visually highlight compromised ECU systems during an active attack.

**CAN Bus Intrusion Detection**
Live monitoring and filtering of vehicle network traffic to detect CAN Flood Attacks, Payload Spoofing, and Replay Attacks in real time.

### Technology Stack

**Frontend**: Next.js, Tailwind CSS, Recharts, Lucide Icons, WebSockets
**Backend**: FastAPI, Motor, Uvicorn
**AI and Detection**: Scikit Learn, Pandas, NumPy
**Infrastructure**: Docker, Docker Compose, MongoDB

### Getting Started

AegisEV is fully containerized for easy deployment.

**Prerequisites**
Docker and Docker Compose
Node.js 
Python 3.10+ 

**Quick Start**

1. Clone the repository:
   ```bash
   git clone https://github.com/YadavHarsh02/AegisEV.git
   cd AegisEV
   ```

2. Build and spin up the entire stack:
   ```bash
   docker compose up -d --build
   ```

3. Access the platform:
   **Frontend Dashboard**: http://localhost:3000
   **Backend API Docs**: http://localhost:8000/docs

### System Architecture

AegisEV is split into a modular micro monolith structure:

`/backend/app/simulator`: Generates high fidelity CAN traffic and physical 96 cell telemetry.
`/backend/app/ml`: Houses the Isolation Forest anomaly detection models.
`/backend/app/detection`: Contains the IncidentCorrelationEngine and AIExplanationEngine.
`/backend/app/websocket`: Manages live, high frequency data streams to the frontend dashboard.
`/frontend`: The Next.js web application utilizing a dense, professional SOC aesthetic.

### Simulating Cyber Attacks

Once the platform is running and the simulator is started via the dashboard, you can trigger simulated attacks:
1. CAN Flood: Overwhelms the vehicle network bus, forcing packet drops and triggering the IDS.
2. Replay Attack: Captures and replays valid packets to manipulate the Battery Management System.
3. Payload Spoofing: Injects malformed voltage and temperature telemetry, triggering physical anomalies and correlating into a Critical Incident.

### License

This project is licensed under the MIT License. See the LICENSE file for details.
