import { useContents } from "./useContentQuery";
import type { ContentItem } from "./useContentQuery";
export type { ContentItem };

export function useContent() {
    const { data: contents = [], refetch, isLoading } = useContents();

    return { 
        contents, 
        refresh: refetch, 
        loading: isLoading 
    }; 
}
