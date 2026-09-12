import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjects } from "@/lib/data";
import { getSuccessor } from "@/lib/successors";
import { NavBar } from "@/components/nav-bar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DiagnosticLab } from "@/components/diagnostic-lab";
import { Footer } from "@/components/footer";

export const dynamicParams = true;

export function generateStaticParams() {
  return getProjects().projects.map((p) => ({ id: p.id.split("/") }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string[] }>;
}): Promise<Metadata> {
  return params.then(async ({ id: segments }) => {
    const decoded = decodeURIComponent(segments.join("/"));
    const project = getProjects().projects.find((p) => p.id === decoded);
    if (!project) return { title: "Not found" };
    return {
      title: `${project.name} — Health Score ${(project.score * 10).toFixed(1)}/10`,
      description: project.description || `Diagnostic health report for ${project.name} on PulsarOss.`,
      openGraph: {
        title: `${project.name} — PulsarOss Health Report`,
        description: project.description || `Health assessment and Android telemetry for ${project.name}.`,
        type: "website",
      },
    };
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const { id: segments } = await params;
  const decoded = decodeURIComponent(segments.join("/"));
  const data = getProjects();
  const project = data.projects.find((p) => p.id === decoded);
  if (!project) notFound();

  const alternatives = data.projects
    .filter((p) => p.id !== project.id && p.genre === project.genre && p.score >= 0.65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const successor = getSuccessor(project.id) || getSuccessor(project.name);

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
            { label: "Catalog", href: "/catalog" },
            { label: project.genre_label || project.genre, href: `/catalog?genre=${project.genre}` },
            { label: project.name },
          ]}
        />

        <DiagnosticLab
          project={project}
          successor={successor}
          alternatives={alternatives}
        />
      </main>

      <Footer generatedAt={data.generated_at} />
    </div>
  );
}
