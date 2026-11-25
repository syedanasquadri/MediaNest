import express from 'express'
import { UserModel, ContentModel, LinkModel } from './db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import ogs from 'open-graph-scraper';
import { JWT_PASSWORD } from './config';
import { userMiddleware } from './middleware';
import { random } from './utils';
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

app.post("/api/v1/signup", async (req, res) => {
    const rawUsername = req.body.username;
    const password = req.body.password;

    if (!rawUsername || !password) {
        res.status(400).json({
            message: "Username and password are required"
        });
        return;
    }

    const username = rawUsername.trim();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({
            username: username,
            password: hashedPassword
        });

        res.json({
            message: "User signed up"
        });
    } catch(e) {
        res.status(409).json({
            message: "User already exists"
        });
    }
});

app.post("/api/v1/signin", async (req, res) => {
    const rawUsername = req.body.username;
    const password = req.body.password;

    if (!rawUsername || !password) {
        res.status(400).json({
            message: "Username and password are required"
        });
        return;
    }

    const username = rawUsername.trim();

    try {
        // Case-insensitive lookup so "anas" matches "Anas"
        const existinguser = await UserModel.findOne({
            username: { $regex: new RegExp(`^${username}$`, "i") }
        });

        if (!existinguser || !existinguser.password) {
            res.status(403).json({
                message: "Wrong username or password"
            });
            return;
        }

        // Support both new bcrypt hashes and legacy plaintext passwords
        let isPasswordCorrect = false;
        if (existinguser.password.startsWith("$2b$") || existinguser.password.startsWith("$2a$")) {
            isPasswordCorrect = await bcrypt.compare(password, existinguser.password);
        } else {
            // Legacy plaintext fallback
            if (password === existinguser.password) {
                isPasswordCorrect = true;
                // Seamlessly migrate legacy plaintext password to bcrypt hash
                existinguser.password = await bcrypt.hash(password, 10);
                await existinguser.save();
            }
        }

        if (!isPasswordCorrect) {
            res.status(403).json({
                message: "Wrong username or password"
            });
            return;
        }

        const token = jwt.sign({
            id: existinguser._id
        }, JWT_PASSWORD);

        res.json({
            token,
        });
    } catch (e) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    let { title, link, type, description, image, siteName, favicon } = req.body;

    if (!title || !link || !type) {
        res.status(400).json({
            message: "Title, link, and type are required"
        });
        return;
    }

    // Auto-detect and resolve LinkedIn shortlinks (lnkd.in) if present
    if (typeof link === "string" && link.includes("lnkd.in")) {
        try {
            const resp = await fetch(link, {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                redirect: 'follow'
            });
            if (resp.url && !resp.url.includes("lnkd.in")) {
                link = resp.url;
            }
        } catch {
            // Retain original link if fetch failed
        }
        type = "linkedin";
    } else if (typeof link === "string" && link.includes("linkedin.com")) {
        type = "linkedin";
    } else if (typeof link === "string" && (link.includes("instagram.com") || link.includes("instagr.am"))) {
        type = "instagram";
        link = link.split('?')[0].replace(/\/+$/, "");
    }

    const tags = Array.isArray(req.body.tags) ? req.body.tags.filter((t: any) => typeof t === "string") : [];

    await ContentModel.create({
        title,
        link,
        type,
        description,
        image,
        siteName,
        favicon,
        userId: req.userId,
        tags
    });

    res.json({
        message: "Content added"
    });
});

app.get("/api/v1/preview", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
        res.status(400).json({ message: "URL parameter is required" });
        return;
    }

    // Handle LinkedIn and lnkd.in shortened links
    if (targetUrl.includes("linkedin.com") || targetUrl.includes("lnkd.in")) {
        let finalUrl = targetUrl;
        if (targetUrl.includes("lnkd.in")) {
            try {
                const response = await fetch(targetUrl, {
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    redirect: 'follow'
                });
                if (response.url && !response.url.includes("lnkd.in")) {
                    finalUrl = response.url;
                }
            } catch (e) {
                // Keep targetUrl as fallback
            }
        }

        let title = "LinkedIn Post";
        let description = "Click to view full post on LinkedIn";
        let image = "";
        let embedUrl = "";

        const slugMatch = finalUrl.match(/\/posts\/[a-zA-Z0-9_-]+_([a-zA-Z0-9_-]+)-(activity|share|ugcPost)-/);
        if (slugMatch && slugMatch[1]) {
            title = slugMatch[1].replace(/[-_]/g, " ");
            title = title.charAt(0).toUpperCase() + title.slice(1);
        }

        // Try to fetch embed metadata (author, commentary text, image) from LinkedIn public embed page
        const urnMatch = finalUrl.match(/-(activity|ugcPost|share)-([0-9]+)/);
        if (urnMatch) {
            embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${urnMatch[1]}:${urnMatch[2]}`;
            try {
                const embedRes = await fetch(embedUrl, {
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
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
                        image = imgMatch[1].replace(/&amp;/g, '&');
                    }
                }
            } catch {
                // Fall back to slug-based title
            }
        }

        res.json({
            title,
            description,
            image,
            siteName: "LinkedIn",
            favicon: "https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca",
            url: finalUrl,
            resolvedUrl: finalUrl,
            embedUrl: embedUrl || finalUrl
        });
        return;
    }

    // Handle Instagram links (Reels, Posts, TV)
    if (targetUrl.includes("instagram.com") || targetUrl.includes("instagr.am")) {
        const shortcodeMatch = targetUrl.match(/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/);
        let title = "Instagram Post";
        let description = "View this post on Instagram";
        let image = "";
        let embedUrl = "";
        const cleanUrl = targetUrl.split('?')[0].replace(/\/+$/, "");

        if (shortcodeMatch) {
            const shortcode = shortcodeMatch[1];
            const mediaType = targetUrl.includes("/reel") ? "reel" : (targetUrl.includes("/tv") ? "tv" : "p");
            embedUrl = `https://www.instagram.com/${mediaType}/${shortcode}/embed`;

            try {
                const embedRes = await fetch(embedUrl, {
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
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
                            const parsed = JSON.parse('"' + captionMatch[2] + '"').replace(/\n/g, ' ').trim();
                            if (parsed) {
                                description = parsed;
                                if (!usernameMatch) title = parsed.slice(0, 60);
                            }
                        } catch {
                            description = captionMatch[2].replace(/\\n/g, ' ').trim();
                        }
                    }
                    if (imgMatch && imgMatch[1]) {
                        image = imgMatch[1].replace(/&amp;/g, '&');
                    }
                }
            } catch {
                // Fall back
            }
        }

        res.json({
            title,
            description,
            image,
            siteName: "Instagram",
            favicon: "https://static.cdninstagram.com/rsrc.php/y4/r/QaBlI0OZiks.ico",
            url: cleanUrl,
            resolvedUrl: cleanUrl,
            embedUrl: embedUrl || `${cleanUrl}/embed`
        });
        return;
    }

    try {
        const { result } = await ogs({
            url: targetUrl,
            timeout: 5000,
            fetchOptions: {
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });

        const title = result.ogTitle || result.twitterTitle || result.dcTitle || "";
        const description = result.ogDescription || result.twitterDescription || result.dcDescription || "";
        const image = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "";
        const siteName = result.ogSiteName || "";
        const favicon = result.favicon || "";

        res.json({
            title,
            description,
            image,
            siteName,
            favicon,
            url: targetUrl
        });
    } catch (e: any) {
        res.status(422).json({
            message: "Could not fetch preview metadata",
            error: e?.message || "Unknown error"
        });
    }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId", "username");

    res.json({
        content
    });
});

app.get("/api/v1/me", userMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId).select("-password");
        if (!user) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }

        const contentCount = await ContentModel.countDocuments({
            userId: req.userId
        });

        res.json({
            username: user.username,
            userId: user._id,
            contentCount
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    const contentId = req.body.contentId;

    if (!contentId) {
        res.status(400).json({
            message: "Content ID is required"
        });
        return;
    }

    try {
        const result = await ContentModel.deleteOne({
            _id: contentId,
            userId: req.userId
        });

        if (result.deletedCount === 0) {
            res.status(404).json({
                message: "Content not found or unauthorized"
            });
            return;
        }

        res.json({
            message: "Content Deleted"
        });
    } catch (e) {
        res.status(500).json({
            message: "Failed to delete content"
        });
    }
});

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    try {
        if (share) {
            const existingLink = await LinkModel.findOne({
                userId: req.userId
            });
            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                });
                return;
            }
            const hash = random(10);
            await LinkModel.create({
                userId: req.userId,
                hash: hash,
            });

            res.json({
                hash: hash,
                message: "/share/" + hash
            });
            return;
        } else {
            await LinkModel.deleteOne({
                userId: req.userId
            });
            res.json({
                message: "Removed link"
            });
            return;
        }
    } catch (e) {
        res.status(500).json({
            message: "Failed to update share link"
        });
    }
});

app.get("/api/v1/brain/:shareLink",async (req,res) => {
    const hash=req.params.shareLink;

    const link=await LinkModel.findOne({
        hash
    });

    if(!link){
        res.status(411).json({
            message:"sorry incorrect input "
        })
        return;
    }
    const content = await ContentModel.find({
        userId: link.userId,
    })
    const user = await UserModel.findOne({
        _id: link.userId,
    })

    if(!user){
        res.status(411).json({
            message:"user not found, error should not ideally happen"
        })
        return;
    }

    res.json({
        username: user.username,
        content:content
    })
})

app.listen(port, () => console.log(`App listening on port ${port}`))