import { CrossIcon } from "./CrossIcon";
import { LogoutIcon } from "../icons/LogoutIcon";
import { UserIcon } from "../icons/UserIcon";

interface ProfileModalProps {
    open: boolean;
    onClose: () => void;
    user: {
        username?: string;
        contentCount?: number;
    } | null;
    onLogout: () => void;
}

export function ProfileModal({ open, onClose, user, onLogout }: ProfileModalProps) {
    if (!open) return null;

    const initial = user?.username ? user.username.charAt(0).toUpperCase() : "U";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 m-4 border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserIcon className="size-6 text-purple-600" />
                        My Profile
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <CrossIcon />
                    </button>
                </div>

                {/* Profile Information */}
                <div className="py-6 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-purple-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
                        {initial}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">
                        {user?.username || "Guest User"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">MediaNest Member</p>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                            <span className="block text-2xl font-bold text-purple-700">
                                {user?.contentCount ?? 0}
                            </span>
                            <span className="text-xs font-medium text-purple-600">Saved Items</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                            <span className="block text-2xl font-bold text-gray-700">Active</span>
                            <span className="text-xs font-medium text-gray-500">Status</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium transition-colors cursor-pointer"
                    >
                        <LogoutIcon className="size-5" />
                        Log Out
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-medium transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

