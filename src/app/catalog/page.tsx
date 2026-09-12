import { Suspense } from "react";
import type { Metadata } from "next";
import { getProjects, getGenres } from "@/lib/data";
import { NavBar } from "@/components/nav-bar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CatalogWorkbench } from "@/components/catalog-workbench";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Catalog Workbench",
  description: "Explore 500+ open-source Android apps with multi-facet filters, Android target SDK audits, and instant exports.",
};

export default function CatalogPage() {
  const data = getProjects();
  const genres = getGenres();

  return (
    <div
      id="main-content"
      className="w-full min-h-screen font-sans flex flex-col relative"
      style={{ color: "var(--color-text)" }}
    >
      <NavBar projects={data.projects} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <BreadcrumbNav
          items={[
            { label: "Home", href: "/" },
            { label: "Catalog Workbench" },
          ]}
        />

        <Suspense fallback={<div className="py-20 text-center font-mono text-xs text-[var(--color-text-dim)]">Loading catalog telemetry...</div>}>
          <CatalogWorkbench projects={data.projects} genres={genres.genres} />
        </Suspense>
      </main>

      <Footer generatedAt={data.generated_at} />
    </div>
  );
}
