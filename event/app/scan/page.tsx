import Scanner from "@/components/Scanner";

export default function ScanPage() {
  return (
    <main className="field-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <p className="text-xs font-medium tracking-[.2em] text-brass-400/80">EVENTLY</p>
          <h1 className="mt-2 text-4xl font-medium">Entry scanner</h1>
          <p className="mt-2 text-bone/45">Use the phone camera to verify a ticket.</p>
        </div>
        <Scanner />
      </div>
    </main>
  );
}
