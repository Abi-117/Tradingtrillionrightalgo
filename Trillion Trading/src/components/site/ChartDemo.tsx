import { ArrowUpRight, ChevronDown, ShieldCheck, TrendingUp } from "lucide-react";
const values = [
  46, 52, 48, 60, 58, 66, 56, 70, 76, 72, 85, 80, 91, 88, 99, 103, 95, 110, 120, 115, 129, 123, 138,
  145, 139, 151, 159, 150, 166, 174, 162, 183, 178, 194, 190, 205,
];
export function ChartDemo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`chart-demo ${compact ? "compact" : ""}`}>
      <div className="chart-header">
        <div>
          <TrendingUp size={17} />
          <strong>BUY & SELL</strong>
          <span className="demo-label">ILLUSTRATIVE DEMO</span>
        </div>
        <span className="chart-market">
          NIFTY 50
          <ChevronDown size={13} />
        </span>
      </div>
      <div className="chart-quote">
        <div>
          <span>NIFTY 50 · NSE</span>
          <strong>
            24,850.60{" "}
            <small>
              +0.82% <ArrowUpRight size={13} />
            </small>
          </strong>
        </div>
        <div className="chart-time">1D</div>
      </div>
      <div className="candle-chart">
        <svg
          viewBox="0 0 620 240"
          role="img"
          aria-label="Illustrative ascending candlestick chart, not live market data"
        >
          <defs>
            <pattern id="chart-grid" width="62" height="48" patternUnits="userSpaceOnUse">
              <path d="M 62 0 L 0 0 0 48" fill="none" className="chart-grid-line" />
            </pattern>
          </defs>
          <rect width="620" height="240" fill="url(#chart-grid)" />
          {values.map((v, i) => {
            const down = i % 4 === 2;
            const y = 218 - v * 0.8;
            return (
              <g key={i} className={down ? "candle-down" : "candle-up"}>
                <line
                  x1={16 + i * 16.5}
                  x2={16 + i * 16.5}
                  y1={y - 9}
                  y2={y + 25}
                  strokeWidth="1.3"
                />
                <rect x={12 + i * 16.5} y={y} width="8" height={down ? 12 : 17} rx="1" />
              </g>
            );
          })}
          <path
            d="M 10 195 Q 100 190 170 157 T 330 125 T 490 85 T 610 42"
            fill="none"
            className="chart-average"
            strokeWidth="2"
          />
          <g className="signal-buy">
            <rect x="162" y="180" width="39" height="21" rx="3" />
            <text x="181" y="194" textAnchor="middle">
              BUY
            </text>
          </g>
          <g className="signal-sell">
            <rect x="436" y="42" width="42" height="21" rx="3" />
            <text x="457" y="56" textAnchor="middle">
              SELL
            </text>
          </g>
        </svg>
        <div className="chart-axis">
          <span>09:15</span>
          <span>10:30</span>
          <span>11:45</span>
          <span>13:00</span>
          <span>14:15</span>
          <span>15:30</span>
        </div>
      </div>
      <div className="chart-bottom">
        <div>
          <span>Market trend</span>
          <strong className="positive">Bullish ↗</strong>
        </div>
        <div>
          <span>Signal</span>
          <strong>Buy zone</strong>
        </div>
        <div>
          <span>Risk controls</span>
          <strong>
            <ShieldCheck size={13} />
            Enabled
          </strong>
        </div>
      </div>
    </div>
  );
}
