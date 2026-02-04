import React, { useState } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { CloudRain, Wind, Droplets, Thermometer, Search, MapPin, TrendingUp, AlertCircle } from 'lucide-react';
import './App.css';

function App() {
  const [city, setCity] = useState("Mumbai");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/predict-risk/${city}`);
      if (res.data.error) throw new Error("City not found");
      setData(res.data);
    } catch (err) {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="header">
        <div className="logo-section">
          <TrendingUp className="logo-icon" />
          <h1>Climate<span className="accent">Migration</span>AI</h1>
        </div>
        <div className="search-box">
          <MapPin size={18} className="search-icon"/>
          <input 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            placeholder="Enter city..."
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
          <button onClick={fetchData} disabled={loading}>
            {loading ? <div className="spinner"></div> : <Search size={18} />}
          </button>
        </div>
      </header>

      {/* ERROR STATE */}
      {error && <div className="error-banner"><AlertCircle size={20}/> City not found or API Error</div>}

      {/* MAIN DASHBOARD */}
      {data && (
        <div className="main-grid">
          
          {/* TOP ROW: KPI CARDS */}
          <div className="kpi-card glass">
            <div className="kpi-icon hot"><Thermometer /></div>
            <div className="kpi-info">
              <span className="kpi-label">Heat Index</span>
              <span className="kpi-value">{data.metrics.heat_index}°C</span>
              <span className="kpi-sub">Feels like</span>
            </div>
          </div>

          <div className="kpi-card glass">
            <div className="kpi-icon wet"><Droplets /></div>
            <div className="kpi-info">
              <span className="kpi-label">Humidity</span>
              <span className="kpi-value">{data.metrics.humidity}%</span>
              <span className="kpi-sub">Water Stress</span>
            </div>
          </div>

          <div className="kpi-card glass">
            <div className="kpi-icon wind"><Wind /></div>
            <div className="kpi-info">
              <span className="kpi-label">Wind Speed</span>
              <span className="kpi-value">{data.metrics.wind} km/h</span>
              <span className="kpi-sub">{data.metrics.condition}</span>
            </div>
          </div>

          <div className={`kpi-card glass risk-box ${data.risk_score > 70 ? 'critical' : 'stable'}`}>
            <div className="kpi-info centered">
              <span className="kpi-label">Total Migration Risk</span>
              <span className="risk-big">{data.risk_score}/100</span>
              <span className="risk-status">{data.risk_score > 70 ? "CRITICAL" : "MODERATE"}</span>
            </div>
          </div>

          {/* MIDDLE ROW: CHARTS */}
          <div className="chart-card glass wide">
            <h3>5-Year Displacement Projection (AI Model)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.forecast}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="year" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Line type="monotone" dataKey="risk" stroke="#00d2ff" strokeWidth={3} dot={{r: 6}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass">
            <h3>Risk Factor Analysis</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.charts.radar}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Risk" dataKey="A" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* WELCOME SCREEN */}
      {!data && !loading && !error && (
        <div className="welcome-screen">
          <h2>Predict Climate Migration with AI</h2>
          <p>Analyze real-time environmental data to forecast population displacement.</p>
        </div>
      )}
    </div>
  );
}

export default App;