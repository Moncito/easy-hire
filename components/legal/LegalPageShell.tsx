import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function LegalPageShell({ title, description, children }: Props) {
  return (
    <>
      <Header />
      <main className="public-header-offset min-h-screen bg-mist px-8 pb-16">
        <article className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-ink/10 pb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-3 text-sm text-ink/55">{description}</p>
          </header>
          <div className="space-y-6 text-sm leading-relaxed text-ink/75">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold text-ink">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export { Section };
