import { TextToBulletsForm } from '@/components/TextToBulletsForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">✨ DotDotDot</h1>
            <p className="text-xl text-muted-foreground">
              Transform walls of text into clean, concise bullet points using AI
            </p>
          </header>

          <TextToBulletsForm />
        </div>
      </div>
    </main>
  );
}
