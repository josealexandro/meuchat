export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <div className="text-6xl mb-4">📴</div>
      <h1 className="text-xl font-semibold mb-2">Você está offline</h1>
      <p className="text-white/80 text-center">
        Verifique sua conexão e tente novamente.
      </p>
    </div>
  );
}
