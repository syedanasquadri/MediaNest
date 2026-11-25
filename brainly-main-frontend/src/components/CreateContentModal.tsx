import { useRef, useState } from "react";
import { CrossIcon } from "./CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";
import { useAddContent } from "../hooks/useContentQuery";
import { api } from "../api/client";

enum ContentType {
    Youtube = "youtube",
    Twitter = "twitter",
    Linkedin = "linkedin",
    Instagram = "instagram",
    Link = "link"
}

interface PreviewData {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
}

interface CreateContentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateContentModal({ open, onClose, onSuccess }: CreateContentModalProps) {
    const titleRef = useRef<HTMLInputElement>(null);
    const linkRef = useRef<HTMLInputElement>(null);
    const [type, setType] = useState<ContentType>(ContentType.Youtube);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [fetchingPreview, setFetchingPreview] = useState(false);
    const addContentMutation = useAddContent();

    const fetchLinkMetadata = async (url: string) => {
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return;

        setFetchingPreview(true);
        try {
            const res = await api.get(`/preview?url=${encodeURIComponent(url)}`);
            setPreview(res.data);

            // Auto-populate title if empty or default
            if (res.data?.title && titleRef.current && (!titleRef.current.value.trim() || titleRef.current.value === "LinkedIn Post")) {
                titleRef.current.value = res.data.title;
            }

            // If the URL was unshortened (e.g. lnkd.in -> linkedin.com/posts/...)
            if (res.data?.resolvedUrl && linkRef.current && res.data.resolvedUrl !== url) {
                linkRef.current.value = res.data.resolvedUrl;
            }
        } catch {
            setPreview(null);
        } finally {
            setFetchingPreview(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        const lower = val.toLowerCase();

        if (lower.includes("youtu.be") || lower.includes("youtube.com")) {
            setType(ContentType.Youtube);
        } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
            setType(ContentType.Twitter);
        } else if (lower.includes("linkedin.com") || lower.includes("lnkd.in")) {
            setType(ContentType.Linkedin);
            fetchLinkMetadata(val);
        } else if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
            setType(ContentType.Instagram);
            fetchLinkMetadata(val);
        } else if (val.startsWith("http")) {
            setType(ContentType.Link);
            fetchLinkMetadata(val);
        }
    };

    const addContent = async () => {
        const title = titleRef.current?.value?.trim();
        const link = linkRef.current?.value?.trim();

        if (!title || !link) {
            alert("Please provide both a title and a URL link.");
            return;
        }

        try {
            await addContentMutation.mutateAsync({
                title,
                link,
                type,
                ...(preview ? {
                    description: preview.description,
                    image: preview.image,
                    siteName: preview.siteName,
                    favicon: preview.favicon
                } : {})
            } as any);

            if (titleRef.current) titleRef.current.value = "";
            if (linkRef.current) linkRef.current.value = "";
            setPreview(null);
            setType(ContentType.Youtube);
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch {
            alert("Failed to add content. Please check your network and try again.");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 m-4 border border-gray-100 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Add New Content</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <CrossIcon />
                    </button>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">URL Link</label>
                        <Input 
                            reference={linkRef} 
                            placeholder="Paste any link: YouTube, Twitter/X, LinkedIn, Medium, GitHub..." 
                            onChange={handleUrlChange}
                            onBlur={() => {
                                const val = linkRef.current?.value?.trim();
                                if (val && (!preview || preview.url !== val)) {
                                    handleUrlChange({ target: { value: val } } as any);
                                }
                            }}
                            onPaste={(e) => {
                                const pastedText = e.clipboardData.getData("text");
                                if (pastedText) {
                                    handleUrlChange({ target: { value: pastedText } } as any);
                                }
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                            Title {fetchingPreview && <span className="text-purple-600 lowercase font-normal">(fetching auto-title...)</span>}
                        </label>
                        <Input reference={titleRef} placeholder="Title for this bookmark" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Platform / Content Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <button
                                type="button"
                                onClick={() => setType(ContentType.Youtube)}
                                className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                                    type === ContentType.Youtube
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                YouTube
                            </button>
                            <button
                                type="button"
                                onClick={() => setType(ContentType.Twitter)}
                                className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                                    type === ContentType.Twitter
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Twitter / X
                            </button>
                            <button
                                type="button"
                                onClick={() => setType(ContentType.Linkedin)}
                                className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                                    type === ContentType.Linkedin
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                LinkedIn
                            </button>
                            <button
                                type="button"
                                onClick={() => setType(ContentType.Instagram)}
                                className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                                    type === ContentType.Instagram
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Instagram
                            </button>
                            <button
                                type="button"
                                onClick={() => setType(ContentType.Link)}
                                className={`py-2 px-2 rounded-lg font-medium text-xs transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                                    type === ContentType.Link
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Web Link
                            </button>
                        </div>
                    </div>

                    {/* Live Preview Card */}
                    {preview && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex gap-3 items-center text-left">
                            {preview.image && (
                                <img 
                                    src={preview.image} 
                                    alt="Preview" 
                                    className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-200" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                            )}
                            <div className="overflow-hidden">
                                <span className="text-xs font-semibold text-purple-600 block truncate">
                                    {preview.siteName || "Web Link Preview"}
                                </span>
                                <p className="text-xs font-semibold text-gray-800 line-clamp-1">{preview.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{preview.description}</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={addContent}
                            variant="primary"
                            text={addContentMutation.isPending ? "Adding..." : "Add Content"}
                            loading={addContentMutation.isPending}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
