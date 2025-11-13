import './StatsCard.css'

const StatsCard = ({ title, value, icon, color, trend, trendValue }) => {
  return (
    <div className={`stats-card ${color}`}>
      <div className="stats-card-content">
        <div className="stats-card-header">
          <div className="stats-card-title">{title}</div>
          <div className="stats-card-icon">{icon}</div>
        </div>
        
        <div className="stats-card-value">{value}</div>
        
        {trend && (
          <div className={`stats-card-trend ${trend}`}>
            <span className="trend-icon">
              {trend === 'up' ? '↑' : '↓'}
            </span>
            <span className="trend-value">{trendValue}</span>
            <span className="trend-label">vs. mes anterior</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard
