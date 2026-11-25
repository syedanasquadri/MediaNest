import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BACKEND_URL } from "../config";
import { Card } from "../components/Card";
import { Logo } from "../icons/Logo";
import axios from "axios";

interface SharedContentItem {
    _id: string;
    title: string;
    link: string;
    type: "youtube" | "twitter" | "linkedin" | "instagram" | "link";
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    tags?: string[];
}

export function ShareView() {
    const { shareLink } = useParams<{ shareLink: string }>();
    const [username, setUsername] = useState<string>("");
    const [content, setContent] = useState<SharedContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!shareLink) return;

        axios.get(`${BACKEND_URL}/api/v1/brain/${shareLink}`)
            .then((res) => {
                setUsername(res.data.username);
                setContent(res.data.content || []);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [shareLink]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Loading shared brain...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl font-bold mb-4">
                    !
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Brain Not Found</h1>
                <p className="text-gray-500 max-w-md mb-6">
                    This share link is either invalid, expired, or the owner has disabled public sharing.
                </p>
                <Link
                    to="/"
                    className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors shadow-sm"
                >
                    Back to MediaNest Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Banner */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center text-xl font-bold text-gray-900 gap-2">
                            <div className="text-purple-600">
                                <Logo />
                            </div>
                            MediaNest
                        </Link>
                        <span className="text-gray-300">|</span>
                        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">
                            <span>🧠</span>
                            <span>{username}'s Brain</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 hidden sm:inline">
                            {content.length} saved item{content.length === 1 ? '' : 's'}
                        </span>
                        <Link
                            to="/signup"
                            className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
                        >
                            Create Your Own Brain
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {content.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <p className="text-lg font-medium text-gray-600 mb-1">This brain has no public items yet.</p>
                        <p className="text-sm text-gray-400">Check back later when {username} adds more links.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-6 justify-start">
                        {content.map((item) => (
                            <Card
                                key={item._id}
                                id={item._id}
                                title={item.title}
                                link={item.link}
                                type={item.type}
                                description={item.description}
                                image={item.image}
                                siteName={item.siteName}
                                favicon={item.favicon}
                                tags={item.tags}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
