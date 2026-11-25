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

