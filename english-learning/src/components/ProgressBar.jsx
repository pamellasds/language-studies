export default function ProgressBar({ value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-bar-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className="progress-bar-fill"
        style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }}
      />
    </div>
  );
}
