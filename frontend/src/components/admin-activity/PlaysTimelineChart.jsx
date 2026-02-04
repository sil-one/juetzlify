import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function PlaysTimelineChart({ data, hours }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-sp-dark rounded-lg p-6">
        <h2 className="text-xl font-bold text-sp-text mb-4">
          Timeline (Last {hours}h)
        </h2>
        <div className="flex items-center justify-center h-[300px] text-sp-text-muted">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-sp-dark border border-sp-light-gray rounded-lg p-3 shadow-lg">
          <p className="text-sp-text-secondary text-xs">{dataPoint.label}</p>
          <p className="text-sp-green font-bold text-sm">
            {dataPoint.plays} {dataPoint.plays === 1 ? 'play' : 'plays'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-sp-dark rounded-lg p-6">
      <h2 className="text-xl font-bold text-sp-text mb-4">
        Timeline (Last {hours}h)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis
            dataKey="label"
            stroke="#B3B3B3"
            tick={{ fill: '#B3B3B3', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#B3B3B3" tick={{ fill: '#B3B3B3' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="plays"
            stroke="#2ECC71"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPlays)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PlaysTimelineChart;
