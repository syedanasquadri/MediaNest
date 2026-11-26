import { useState, useEffect } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CreateContentModal } from '../components/CreateContentModal'
import { ProfileModal } from '../components/ProfileModal'
import { ShareModal } from '../components/ShareModal'
import { SearchModal } from '../components/SearchModal'
import { ChatDrawer } from '../components/ChatDrawer'
import { PlusIcon } from '../icons/PlusIcon'
import { ShareIcon } from '../icons/ShareIcon'
import { UserIcon } from '../icons/UserIcon'
import { SparklesIcon } from '../icons/SparklesIcon'
import { SideBar } from '../components/Sidebar'
import { useContent } from '../hooks/useContent'
import { useUserProfile, useDeleteContent } from '../hooks/useContentQuery'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "twitter" | "youtube" | "linkedin" | "instagram" | "link">("all");
  
  const { data: user } = useUserProfile();
  const deleteMutation = useDeleteContent();
  const { contents, loading } = useContent();
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K keyboard shortcut to launch AI search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteMutation.mutateAsync(contentId);
    } catch {
      alert("Failed to delete content. Please try again.");
    }
  };

  // Helper to determine normalized content category
  const getNormalizedType = (itemType: string, link: string) => {
    const rawType = itemType?.toLowerCase() || "";
    if (link?.includes("linkedin.com") || link?.includes("lnkd.in")) return "linkedin";
    if (link?.includes("instagram.com") || link?.includes("instagr.am")) return "instagram";
    if (link?.includes("youtu.be") || link?.includes("youtube.com")) return "youtube";
    if (link?.includes("twitter.com") || link?.includes("x.com")) return "twitter";
    return rawType;
  };

  // Filter content based on active sidebar tab
  const displayedContents = contents.filter((item) => {
    if (filter === "all") return true;
    return getNormalizedType(item.type, item.link) === filter;
  });

  const getFilterLabel = () => {
    if (filter === "all") return "All saved links and media";
    if (filter === "link") return "Filtering by Articles & Web Links";
    if (filter === "youtube") return "Filtering by YouTube Videos";
    if (filter === "linkedin") return "Filtering by LinkedIn Posts";
    if (filter === "instagram") return "Filtering by Instagram Posts & Reels";
    return "Filtering by Twitter / X Posts";
  };

  return (
    <div>
      <SideBar 
        user={user} 
        currentFilter={filter}
        onSelectFilter={setFilter}
        onOpenProfile={() => setProfileOpen(true)} 
        onOpenChat={() => setChatOpen(true)}
        onLogout={handleLogout} 
      />

      <ProfileModal 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        user={user} 
        onLogout={handleLogout} 
      />

      <ShareModal 
        open={shareOpen} 
        onClose={() => setShareOpen(false)} 
      />

      <CreateContentModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <div className="p-6 ml-72 min-h-screen bg-gray-50">
        {/* Top Header */}
        <div className="flex justify-between items-center pb-6 border-b border-gray-200 mb-6 gap-4">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome back{user?.username ? `, ${user.username}` : ''}!
            </h1>
            <p className="text-sm text-gray-500">
              {getFilterLabel()}
            </p>
          </div>

          {/* AI Search Bar trigger */}
          <div
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-400 hover:text-gray-600 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all flex-1 max-w-md mx-4 group"
            title="Ask your Second Brain (Cmd+K)"
          >
            <SparklesIcon className="size-4 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-sm truncate">Ask Second Brain... (e.g. "which language for DSA?")</span>
            <kbd className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono border border-gray-200 shrink-0">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button 
              onClick={() => setModalOpen(true)} 
              variant="primary" 
              text="Add Content" 
              startIcon={<PlusIcon />} 
            />
            <Button 
              onClick={() => setShareOpen(true)} 
              variant="secondary" 
              text="Share Brain" 
              startIcon={<ShareIcon />} 
            />
            <button 
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium shadow-sm"
              title="My Profile"
            >
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-purple-200">
                {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="size-4" />}
              </div>
              <span>Profile</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading your content...</p>
          </div>
        ) : displayedContents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-3xl mx-auto mb-4">
              ✨
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {contents.length === 0 ? "Your second brain is empty" : `No ${filter} items found`}
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {contents.length === 0 
                ? "Start curating your personal knowledge nest by adding YouTube videos, Tweets, or web articles."
                : `You don't have any items under "${filter}". Add one or switch back to "All Content".`}
            </p>
            <Button 
              onClick={() => setModalOpen(true)} 
              variant="primary" 
              text="Add First Content" 
              startIcon={<PlusIcon />} 
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 items-start">
            {displayedContents.map((item) => (
              <Card
                key={item._id}
                id={item._id}
                type={item.type}
                link={item.link}
                title={item.title}
                description={item.description}
                image={item.image}
                siteName={item.siteName}
                favicon={item.favicon}
                tags={item.tags}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
