import { useState, useEffect, useRef } from "react";
import { SearchIcon } from "../icons/SearchIcon";
import { SparklesIcon } from "../icons/SparklesIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { ArticleIcon } from "../icons/ArticleIcon";
import { CrossIcon } from "./CrossIcon";
import { useSemanticSearch, type SearchResultItem } from "../hooks/useContentQuery";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input to keep typing smooth and snappy
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus input on modal open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const { data: results = [], isLoading, isFetching } = useSemanticSearch(
    debouncedQuery,
    Boolean(open && debouncedQuery)
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 bg-white">
          <div className="text-purple-600 mr-3 shrink-0">
            <SparklesIcon className="size-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask your Second Brain... (e.g. "which language for DSA?")'
            className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm sm:text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors mr-2 cursor-pointer"
              title="Clear search"
            >
              <CrossIcon />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 sm:p-3 divide-y divide-gray-50 flex-1">
          {isLoading || isFetching ? (
            <div className="py-12 text-center text-gray-500">
              <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              <p className="text-xs font-medium text-gray-500">Scanning knowledge vectors with Gemini...</p>
            </div>
          ) : !debouncedQuery ? (
            <div className="py-10 text-center text-gray-400">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2.5">
                <SearchIcon className="size-5" />
              </div>
              <p className="text-sm font-medium text-gray-600">Search your Second Brain</p>
              <p className="text-xs text-gray-400 mt-1">
                Type natural questions to find specific moments in videos and articles.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <p className="text-sm font-medium text-gray-600">No matching moments found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching with different keywords or add more content.
              </p>
            </div>
          ) : (
            results.map((result: SearchResultItem) => (
              <a
                key={result.chunkId}
                href={result.jumpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-purple-50/60 transition-colors cursor-pointer"
              >
                {/* Left: Icon & Content Preview */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="shrink-0 mt-0.5">
                    {result.type === "youtube" ? (
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shadow-xs">
                        <YoutubeIcon />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                        <ArticleIcon />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title & Match % */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-700 transition-colors">
                        {result.title}
                      </h4>
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100/70 text-purple-700">
                        {Math.round(result.similarityScore * 100)}%
                      </span>
                    </div>

                    {/* Short concise snippet (1-2 lines max) */}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {result.snippet || result.text.slice(0, 130) + "..."}
                    </p>
                  </div>
                </div>

                {/* Right: Timestamp or Jump Action Button */}
                <div className="shrink-0 flex items-center gap-2">
                  {result.timestampFormatted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600 text-white text-xs font-medium group-hover:bg-purple-700 transition-colors shadow-xs">
                      <span>▶</span>
                      <span>{result.timestampFormatted}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <span>Open</span>
                      <span>↗</span>
                    </span>
                  )}
                </div>
              </a>
            ))
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>AI Vector Retrieval &bull; Google Gemini</span>
          <span>Click any item to jump directly to that moment</span>
        </div>
      </div>
    </div>
  );
}
