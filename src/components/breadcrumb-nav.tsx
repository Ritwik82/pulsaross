import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 font-mono text-[10px] tracking-widest uppercase flex items-center flex-wrap gap-2 text-[var(--color-text-dim)]"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href && !isLast ? (
              <Link
                href={item.href as unknown as Parameters<typeof Link>[0]["href"]}
                className="hover:text-[var(--color-accent)] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className="text-[var(--color-text)] font-semibold">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
