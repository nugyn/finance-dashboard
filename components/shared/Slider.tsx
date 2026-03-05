export const Slider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  sub,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  sub?: string;
}) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-xs text-gray-400">
        {label}
        {sub && <span className="text-gray-500"> — {sub}</span>}
      </span>
      <span className="text-xs font-mono text-white">{format ? format(value) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded appearance-none bg-gray-600 accent-indigo-400 cursor-pointer"
    />
    <div className="flex justify-between mt-0.5">
      <span className="text-xs text-gray-600">{format ? format(min) : min}</span>
      <span className="text-xs text-gray-600">{format ? format(max) : max}</span>
    </div>
  </div>
);
