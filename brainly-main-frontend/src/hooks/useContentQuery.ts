import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export interface ContentItem {
  _id: string;
  title: string;
  link: string;
  type: "youtube" | "twitter" | "linkedin" | "link";
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  tags?: string[];
  createdAt?: string;
}

export interface UserProfile {
  username: string;
  userId: string;
  contentCount: number;
}

export function useContents() {
  return useQuery<ContentItem[]>({
    queryKey: ["contents"],
    queryFn: async () => {
      const res = await api.get("/content");
      return res.data.content || [];
    },
  });
}

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/me");
      return res.data;
    },
  });
}

export function useAddContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; link: string; type: string }) => {
      const res = await api.post("/content", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await api.delete("/content", { data: { contentId } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export interface SearchResultItem {
  chunkId: string;
  contentId: string;
  title: string;
  link: string;
  type: string;
  image?: string;
  siteName?: string;
  snippet?: string;
  text: string;
  startSeconds?: number;
  endSeconds?: number;
  timestampFormatted?: string;
  jumpUrl: string;
  similarityScore: number;
}

export function useSemanticSearch(query: string, enabled = false) {
  return useQuery<SearchResultItem[]>({
    queryKey: ["semantic-search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
      return res.data.results || [];
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export interface ChatSource {
  id: number;
  chunkId: string;
  contentId: string;
  title: string;
  type: string;
  timestamp?: string;
  jumpUrl: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (payload: { message: string; history?: { role: string; content: string }[] }) => {
      const res = await api.post("/chat", payload);
      return res.data;
    },
  });
}

