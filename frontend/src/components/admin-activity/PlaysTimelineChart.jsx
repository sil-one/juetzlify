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
  // Format time period label
  const timeLabel = hours >= 24 ? `${hours / 24}d` : `${hours}h`;

  if (!data || data.length === 0) {
    return (
      <div className="bg-sp-dark rounded-lg p-6">
        <h2 className="text-xl font-bold text-sp-text mb-4">
          Timeline (Last {timeLabel})
        </h2>
        <div className="flex items-center justify-center h-[300px] text-sp-text-muted">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Custom tooltip with top tracks
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const hasTopTracks = dataPoint.topTracks && dataPoint.topTracks.length > 0;

      return (
        <div className="bg-sp-dark border border-sp-light-gray rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-sp-text-secondary text-xs mb-1">{dataPoint.label}</p>
          <p className="text-sp-green font-bold text-sm mb-2">
            {dataPoint.plays} {dataPoint.plays === 1 ? 'play' : 'plays'}
          </p>

          {hasTopTracks && (
            <div className="mt-2 pt-2 border-t border-sp-gray">
              <p className="text-sp-text-muted text-xs mb-1.5">Top tracks:</p>
              <div className="space-y-1">
                {dataPoint.topTracks.map((track, index) => (
                  <div key={track.filename} className="text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sp-text-muted font-mono">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sp-text truncate">{track.title}</p>
                        <p className="text-sp-text-secondary truncate">{track.artist}</p>
                      </div>
                      <span className="text-sp-green font-medium ml-1">×{track.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-sp-dark rounded-lg p-6">
      <h2 className="text-xl font-bold text-sp-text mb-4">
        Timeline (Last {timeLabel})
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
