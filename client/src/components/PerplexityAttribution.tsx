export function PerplexityAttribution() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a
        href="https://www.perplexity.ai/computer"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Built with Perplexity
      </a>
    </div>
  );
}
