import ogs from "open-graph-scraper";

export interface PreviewData {
    title: string;
    description: string;
    image?: string;
    siteName: string;
    favicon?: string;
    url: string;
    resolvedUrl?: string;
    embedUrl?: string;
}

const BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function resolveUrl(url: string): Promise<string> {
    if (!url.includes("lnkd.in")) return url;

    try {
        const response = await fetch(url, {
            headers: { "user-agent": BROWSER_USER_AGENT },
            redirect: "follow"
        });
        if (response.url && !response.url.includes("lnkd.in")) {
            return response.url;
        }
    } catch {
        // Fall back to original URL
    }
    return url;
}

export async function fetchLinkedInMetadata(targetUrl: string): Promise<PreviewData> {
    const finalUrl = await resolveUrl(targetUrl);

    let title = "LinkedIn Post";
    let description = "Click to view full post on LinkedIn";
    let image = "";
    let embedUrl = "";

    const slugMatch = finalUrl.match(/\/posts\/[a-zA-Z0-9_-]+_([a-zA-Z0-9_-]+)-(activity|share|ugcPost)-/);
    if (slugMatch && slugMatch[1]) {
        title = slugMatch[1].replace(/[-_]/g, " ");
        title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    const urnMatch = finalUrl.match(/-(activity|ugcPost|share)-([0-9]+)/);
    if (urnMatch) {
        embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${urnMatch[1]}:${urnMatch[2]}`;
        try {
            const embedRes = await fetch(embedUrl, {
                headers: { "user-agent": BROWSER_USER_AGENT }
            });
            if (embedRes.ok) {
                const html = await embedRes.text();
                const textMatch = html.match(/data-test-id="main-feed-activity-embed-card__commentary">([^<]+)<\/p>/);
                const authorMatch = html.match(/aria-label="View profile for ([^"]+)"/);
                const imgMatch = html.match(/(https:\/\/media\.licdn\.com\/dms\/image\/[^" '&]+)/);

                if (textMatch && textMatch[1]) {
                    const postText = textMatch[1].trim();
                    if (postText) {
                        title = postText.length > 80 ? postText.slice(0, 80) + "..." : postText;
                        description = postText;
                    }
                }
                if (authorMatch && authorMatch[1]) {
                    description = `${authorMatch[1]} on LinkedIn: "${description}"`;
                }
                if (imgMatch && imgMatch[1]) {
                    image = imgMatch[1].replace(/&amp;/g, "&");
                }
            }
        } catch {
            // Fall back to slug-based title
        }
    }

    return {
        title,
        description,
        image,
        siteName: "LinkedIn",
        favicon: "https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca",
        url: finalUrl,
        resolvedUrl: finalUrl,
        embedUrl: embedUrl || finalUrl
    };
}

export async function fetchInstagramMetadata(targetUrl: string): Promise<PreviewData> {
    const shortcodeMatch = targetUrl.match(/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/);
    let title = "Instagram Post";
    let description = "View this post on Instagram";
    let image = "";
    let embedUrl = "";
    const cleanUrl = targetUrl.split("?")[0].replace(/\/+$/, "");

    if (shortcodeMatch) {
        const shortcode = shortcodeMatch[1];
        const mediaType = targetUrl.includes("/reel") ? "reel" : (targetUrl.includes("/tv") ? "tv" : "p");
        embedUrl = `https://www.instagram.com/${mediaType}/${shortcode}/embed`;

        try {
            const embedRes = await fetch(embedUrl, {
                headers: { "user-agent": BROWSER_USER_AGENT }
            });
            if (embedRes.ok) {
                const html = await embedRes.text();
                const usernameMatch = html.match(/class="UsernameText">([^<]+)<\/span>/i) || html.match(/\/instagram\.com\/(?:stories\/)?([a-zA-Z0-9._]+)\//i);
                const imgMatch = html.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/i);
                const captionMatch = html.match(/edge_media_to_caption.*?text[\\"]*:([\\"]+)(.*?)\1/);

                if (usernameMatch && usernameMatch[1]) {
                    title = `@${usernameMatch[1]} on Instagram`;
                }
                if (captionMatch && captionMatch[2]) {
                    try {
                        const parsed = JSON.parse('"' + captionMatch[2] + '"').replace(/\n/g, " ").trim();
                        if (parsed) {
                            description = parsed;
                            if (!usernameMatch) title = parsed.slice(0, 60);
                        }
                    } catch {
                        description = captionMatch[2].replace(/\\n/g, " ").trim();
                    }
                }
                if (imgMatch && imgMatch[1]) {
                    image = imgMatch[1].replace(/&amp;/g, "&");
                }
            }
        } catch {
            // Fall back
        }
    }

    return {
        title,
        description,
        image,
        siteName: "Instagram",
        favicon: "https://static.cdninstagram.com/rsrc.php/y4/r/QaBlI0OZiks.ico",
        url: cleanUrl,
        resolvedUrl: cleanUrl,
        embedUrl: embedUrl || `${cleanUrl}/embed`
    };
}

export async function fetchOpenGraphMetadata(targetUrl: string): Promise<PreviewData> {
    const { result } = await ogs({
        url: targetUrl,
        timeout: 5000,
        fetchOptions: {
            headers: { "user-agent": BROWSER_USER_AGENT }
        }
    });

    const title = result.ogTitle || result.twitterTitle || result.dcTitle || "";
    const description = result.ogDescription || result.twitterDescription || result.dcDescription || "";
    const image = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "";
    const siteName = result.ogSiteName || "";
    const favicon = result.favicon || "";

    return {
        title,
        description,
        image,
        siteName,
        favicon,
        url: targetUrl,
        resolvedUrl: targetUrl
    };
}

export async function fetchPreviewMetadata(targetUrl: string): Promise<PreviewData> {
    if (targetUrl.includes("linkedin.com") || targetUrl.includes("lnkd.in")) {
        return fetchLinkedInMetadata(targetUrl);
    }

    if (targetUrl.includes("instagram.com") || targetUrl.includes("instagr.am")) {
        return fetchInstagramMetadata(targetUrl);
    }

    return fetchOpenGraphMetadata(targetUrl);
}

