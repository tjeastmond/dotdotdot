import { TextToBulletsForm } from '@/components/TextToBulletsForm';
import { StickyHeader } from '@/components/StickyHeader';

export default function Home() {
  return (
    <>
      <StickyHeader />
      <main className="min-h-screen pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform walls of text into clean, concise bullet points using AI. Get instant insights and actionable
                intelligence from your content.
              </p>
            </header>

            <TextToBulletsForm />
          </div>
        </div>
      </main>
    </>
  );
}
