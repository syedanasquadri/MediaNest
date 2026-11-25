import { useState } from "react";
import { CrossIcon } from "./CrossIcon";
import { ShareIcon } from "../icons/ShareIcon";
import { BACKEND_URL } from "../config";
import axios from "axios";

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
}

export function ShareModal({ open, onClose }: ShareModalProps) {
    const [shareUrl, setShareUrl] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggleShare = async (enable: boolean) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`${BACKEND_URL}/api/v1/brain/share`, {
                share: enable
            }, {
                headers: {
                    Authorization: token
                }
            });

            if (enable && response.data.hash) {
                const fullUrl = `${window.location.origin}/share/${response.data.hash}`;
                setShareUrl(fullUrl);
            } else {
                setShareUrl("");
            }
        } catch {
            alert("Failed to update brain sharing status.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
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
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 m-4 border border-gray-100">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ShareIcon />
                        Share Your Second Brain
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <CrossIcon />
                    </button>
                </div>

                <div className="py-5">
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                        Share your curated collection of videos and tweets with anyone. Anyone with the public link will be able to view your saved items without signing in.
                    </p>

                    {shareUrl ? (
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                                Your Public Share Link
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-mono select-all focus:outline-none"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-2.5 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors cursor-pointer shrink-0 shadow-sm shadow-purple-200"
                                >
                                    {copied ? "Copied!" : "Copy Link"}
                                </button>
                            </div>

                            <div className="pt-2 flex justify-between items-center">
                                <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    Brain Sharing is Active
                                </span>
                                <button
                                    onClick={() => toggleShare(false)}
                                    disabled={loading}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline cursor-pointer"
                                >
                                    Disable public sharing
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200">
                            <p className="text-sm text-gray-500 mb-4">
                                Your brain is currently private. Click below to generate a shareable link.
                            </p>
                            <button
                                onClick={() => toggleShare(true)}
                                disabled={loading}
                                className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors cursor-pointer shadow-sm shadow-purple-200"
                            >
                                {loading ? "Generating Link..." : "Create Shareable Link"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

