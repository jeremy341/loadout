// The address a stored image is served from. No database, so client components can import it.
export const mediaUrl = (id: string): string => `/api/journal-media/${id}`;
