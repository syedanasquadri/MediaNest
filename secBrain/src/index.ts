import express from 'express'
import { UserModel, ContentModel, LinkModel } from './db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
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
    const title = req.body.title;
    const link = req.body.link;
    const type = req.body.type;

    if (!title || !link || !type) {
        res.status(400).json({
            message: "Title, link, and type are required"
        });
        return;
    }

    await ContentModel.create({
        title,
        link,
        type,
        userId: req.userId,
        tags: []
    });

    res.json({
        message: "Content added"
    });
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