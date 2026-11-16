import { container } from "@/components/ui/styles";

/** Title block used at the top of every inner page. */
export function PageHeader({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-grid border-b border-line pt-16">
      <div className={`${container} py-14 sm:py-20`}>
        <p className="label">{label}</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
          <span className="text-chrome">{title}</span>
        </h1>
        {children && <div className="mt-6 max-w-2xl text-base leading-relaxed text-steel">{children}</div>}
      </div>
    </div>
  );
}
