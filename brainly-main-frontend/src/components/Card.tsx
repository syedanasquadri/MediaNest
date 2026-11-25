import { useEffect } from "react";
import { ShareIcon } from "../icons/ShareIcon";
import { TrashIcon } from "../icons/TrashIcon";

interface CardProps {
    id?: string;
    title: string;
    link: string;
    type: "youtube" | "twitter" | "linkedin" | "instagram" | "link";
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    tags?: string[];
    onDelete?: (id: string) => void;
}

function getYouTubeEmbedUrl(rawUrl: string): string {
    if (!rawUrl) return "";
    const url = rawUrl.trim();

    try {
        if (url.includes("/embed/")) {
            const match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
            return url;
        }

        const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (youtuBeMatch && youtuBeMatch[1]) return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;

        const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch && shortsMatch[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

        const liveMatch = url.match(/\/live\/([a-zA-Z0-9_-]{11})/);
        if (liveMatch && liveMatch[1]) return `https://www.youtube.com/embed/${liveMatch[1]}`;

        const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (watchMatch && watchMatch[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    } catch {
        // Fallback
    }

    return url.replace("watch", "embed").replace("?v=", "/");
}

function getLinkedInEmbedUrl(rawUrl: string): string | null {
    if (!rawUrl) return null;
    const url = rawUrl.trim();

    if (url.includes("/embed/")) {
        return url;
    }

    // Format 1: /feed/update/urn:li:(activity|share|ugcPost):<id>
    const urnMatch = url.match(/urn:li:(activity|share|ugcPost):([0-9]+)/);
    if (urnMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:${urnMatch[1]}:${urnMatch[2]}`;
    }

    // Format 2: /posts/username_slug-activity-<id>-hash or -ugcPost-<id> or -share-<id>
    const postSlugMatch = url.match(/-(activity|ugcPost|share)-([0-9]+)/);
    if (postSlugMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:${postSlugMatch[1]}:${postSlugMatch[2]}`;
    }

    // Format 3: /posts/... with activity-<id>
    const activityMatch = url.match(/activity-([0-9]+)/);
    if (activityMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`;
    }

    // Format 4: activity:123 or share:123
    const plainActivityMatch = url.match(/activity[:/]([0-9]+)/);
    if (plainActivityMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${plainActivityMatch[1]}`;
    }

    const plainShareMatch = url.match(/share[:/]([0-9]+)/);
    if (plainShareMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:share:${plainShareMatch[1]}`;
    }

    return null;
}

function getInstagramEmbedUrl(rawUrl: string): string | null {
    if (!rawUrl) return null;
    const url = rawUrl.trim();

    if (url.includes("/embed")) {
        return url;
    }

    const match = url.match(/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/);
    if (match) {
        const shortcode = match[1];
        const mediaType = url.includes("/reel") ? "reel" : (url.includes("/tv") ? "tv" : "p");
        return `https://www.instagram.com/${mediaType}/${shortcode}/embed`;
    }

    return null;
}

export function Card({ id, title, link, type, description, image, siteName, favicon, tags, onDelete }: CardProps) {
    let effectiveType = type;
    if (type === "link" || !type) {
        if (link.includes("linkedin.com") || link.includes("lnkd.in")) effectiveType = "linkedin";
        else if (link.includes("instagram.com") || link.includes("instagr.am")) effectiveType = "instagram";
        else if (link.includes("youtu.be") || link.includes("youtube.com")) effectiveType = "youtube";
        else if (link.includes("twitter.com") || link.includes("x.com")) effectiveType = "twitter";
    }

    useEffect(() => {
        if (effectiveType === "twitter" && (window as any).twttr?.widgets?.load) {
            (window as any).twttr.widgets.load();
        }
    }, [link, effectiveType]);

    const linkedInEmbed = effectiveType === "linkedin" ? getLinkedInEmbedUrl(link) : null;
    const instagramEmbed = effectiveType === "instagram" ? getInstagramEmbedUrl(link) : null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between w-80 min-h-64">
            <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-gray-800 text-base line-clamp-2 leading-snug">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 text-gray-400">
                        <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Open original link"
                        >
                            <ShareIcon />
                        </a>
                        {onDelete && id && (
                            <button
                                onClick={() => onDelete(id)}
                                className="p-1 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete link"
                            >
                                <TrashIcon className="size-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content media */}
                <div className="pt-4">
                    {/* YouTube Embed */}
                    {effectiveType === "youtube" && (
                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe 
                                className="w-full h-full" 
                                src={getYouTubeEmbedUrl(link)} 
                                title={title}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                referrerPolicy="strict-origin-when-cross-origin" 
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Twitter / X Embed */}
                    {effectiveType === "twitter" && (
                        <div className="max-h-80 overflow-y-auto">
                            <blockquote className="twitter-tweet">
                                <a href={link.replace("x.com", "twitter.com")} />
                            </blockquote>
                        </div>
                    )}

                    {/* LinkedIn Embed */}
                    {effectiveType === "linkedin" && (
                        <div className="w-full min-h-80 rounded-lg overflow-hidden bg-white border border-gray-100 shadow-inner flex flex-col justify-between">
                            {linkedInEmbed ? (
                                <iframe 
                                    src={linkedInEmbed} 
                                    className="w-full h-96"
                                    frameBorder="0" 
                                    allowFullScreen 
                                    title={title || "LinkedIn Post"}
                                />
                            ) : (
                                <div className="p-4 flex flex-col justify-between h-full bg-blue-50/40">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">LinkedIn</span>
                                            {siteName && <span className="text-xs text-gray-500 font-medium">{siteName}</span>}
                                        </div>
                                        {image && (
                                            <img 
                                                src={image} 
                                                alt={title} 
                                                className="w-full h-36 object-cover rounded-md mb-2 bg-gray-200" 
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        )}
                                        <h4 className="font-semibold text-gray-800 text-sm mt-1">{title}</h4>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                                            {description || "Click below to view the post directly on LinkedIn."}
                                        </p>
                                    </div>
                                    <a 
                                        href={link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-xs font-medium text-blue-600 hover:underline mt-3 inline-block"
                                    >
                                        Open post on LinkedIn &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instagram Embed */}
                    {effectiveType === "instagram" && (
                        <div className="w-full min-h-[460px] rounded-lg overflow-hidden bg-white border border-gray-100 shadow-inner flex flex-col justify-between">
                            {instagramEmbed ? (
                                <iframe 
                                    src={instagramEmbed} 
                                    className="w-full h-[460px]"
                                    frameBorder="0" 
                                    scrolling="no"
                                    allowFullScreen 
                                    title={title || "Instagram Post"}
                                />
                            ) : (
                                <div className="p-4 flex flex-col justify-between h-full bg-pink-50/40">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-pink-700 bg-pink-100 px-2 py-0.5 rounded">Instagram</span>
                                            {siteName && <span className="text-xs text-gray-500 font-medium">{siteName}</span>}
                                        </div>
                                        {image && (
                                            <img 
                                                src={image} 
                                                alt={title} 
                                                className="w-full h-44 object-cover rounded-md mb-2 bg-gray-200" 
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        )}
                                        <h4 className="font-semibold text-gray-800 text-sm mt-1">{title}</h4>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                                            {description || "Click below to view the post directly on Instagram."}
                                        </p>
                                    </div>
                                    <a 
                                        href={link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-xs font-medium text-pink-600 hover:underline mt-3 inline-block"
                                    >
                                        Open on Instagram &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rich Open Graph Link Preview */}
                    {effectiveType === "link" && (
                        <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block rounded-lg overflow-hidden border border-gray-100 bg-gray-50 hover:bg-gray-100/80 transition-all text-left"
                        >
                            {image && (
                                <div className="w-full h-36 bg-gray-200 overflow-hidden">
                                    <img 
                                        src={image} 
                                        alt={title} 
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <div className="p-3">
                                {siteName && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {favicon && (
                                            <img 
                                                src={favicon} 
                                                alt="" 
                                                className="w-3.5 h-3.5 rounded" 
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                                            />
                                        )}
                                        <span className="text-xs font-semibold text-purple-600 truncate">{siteName}</span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                    {description || "No preview description available. Click to read the full article."}
                                </p>
                            </div>
                        </a>
                    )}
                </div>
            </div>

            {/* Tags Pills (only rendered when tags exist) */}
            {tags && tags.length > 0 && (
                <div className="pt-3 flex flex-wrap gap-1.5 items-center">
                    {tags.map((tag, idx) => (
                        <span 
                            key={idx} 
                            className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md hover:bg-purple-50 hover:text-purple-600 transition-colors"
                        >
                            #{tag.replace(/^#/, '')}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer platform tag */}
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="capitalize font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    {type === "link" ? (siteName || "Article") : type}
                </span>
                <span className="truncate max-w-44 text-gray-400">
                    {link.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
            </div>
        </div>
    );
}
