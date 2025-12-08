export const runtime = "nodejs";

export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Colorhackers AI Backend</h1>
      <p>Backend is running.</p>
      <p>API route: /api/generate-silo-realm</p>
    </div>
  );
}
