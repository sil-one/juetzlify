import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function HottestTracksChart({ data, timeWindow }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-sp-dark rounded-lg p-6">
        <h2 className="text-xl font-bold text-sp-text mb-4">
          Hottest Tracks (Last {timeWindow}h)
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-sp-text-muted">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>No plays in the last {timeWindow}h</p>
        </div>
      </div>
    );
  }

  // Custom tooltip with Spotify theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const track = payload[0].payload;
      return (
        <div className="bg-sp-dark border border-sp-light-gray rounded-lg p-3 shadow-lg">
          <p className="text-sp-text font-bold text-sm">{track.title}</p>
          <p className="text-sp-text-secondary text-xs mb-1">{track.artist}</p>
          <p className="text-sp-green font-bold text-sm">
            {track.count} {track.count === 1 ? 'play' : 'plays'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-sp-dark rounded-lg p-6">
      <h2 className="text-xl font-bold text-sp-text mb-4">
        Hottest Tracks (Last {timeWindow}h)
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis type="number" stroke="#B3B3B3" />
          <YAxis
            type="category"
            dataKey="title"
            width={150}
            stroke="#B3B3B3"
            tick={{ fill: '#B3B3B3', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#282828' }} />
          <Bar dataKey="count" fill="#2ECC71" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HottestTracksChart;
