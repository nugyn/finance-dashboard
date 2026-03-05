export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">{title}</h2>
    {children}
  </div>
);
