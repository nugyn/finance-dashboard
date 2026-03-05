export const Row = ({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  sub?: string;
}) => (
  <div
    className={`flex justify-between items-center py-2 border-b border-gray-700 ${
      highlight ? "text-emerald-400 font-bold" : "text-gray-300"
    }`}
  >
    <span className="text-sm">
      {label}
      {sub && <span className="text-xs text-gray-500 ml-1">{sub}</span>}
    </span>
    <span className="text-sm font-mono">{value}</span>
  </div>
);
