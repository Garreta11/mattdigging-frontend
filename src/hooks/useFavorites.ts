import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Track, fetchTracks } from '../services/api';
import { useAppContext } from '../context/AppContext';

export interface FavoriteTrack extends Track {
  added_at: string;
}

export const useFavorites = () => {
  const { user } = useAppContext();
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch favorites ──────────────────────────────────────
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('user_favorites')
        .select('track_id, added_at')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      if (!data || data.length === 0) {
        setFavorites([]);
        setFavoriteIds(new Set());
        return;
      }

      // Fetch full track data from your API
      const trackIds = data.map((f) => f.track_id).join(',');
      const tracks = await fetchTracks(`?ids=${trackIds}`);

      // Preserve the added_at order from Supabase
      const trackMap = new Map(tracks.map((t) => [t.id, t]));
      const favoriteTracks: FavoriteTrack[] = data
        .map((f) => {
          const track = trackMap.get(f.track_id);
          if (!track) return null;
          return { ...track, added_at: f.added_at };
        })
        .filter(Boolean) as FavoriteTrack[];

      setFavorites(favoriteTracks);
      setFavoriteIds(new Set(favoriteTracks.map((t) => t.id)));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch favorites.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // ── Toggle favorite ──────────────────────────────────────
  const toggleFavorite = useCallback(async (track: Track) => {
    if (!user?.id) return;

    const isFav = favoriteIds.has(track.id);

    // Optimistic update
    if (isFav) {
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(track.id); return next; });
      setFavorites((prev) => prev.filter((t) => t.id !== track.id));
    } else {
      setFavoriteIds((prev) => new Set(prev).add(track.id));
      setFavorites((prev) => [{ ...track, added_at: new Date().toISOString() }, ...prev]);
    }

    try {
      if (isFav) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', track.id);
        if (error) throw error;
      } else {
        console.log('Full track object:', track);
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, track_id: track.id });

        if (error) {
          console.log('Insert error:', JSON.stringify(error, null, 2));
          throw error;
        }
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      fetchFavorites();
      setError(err.message || 'Failed to update favorites.');
    }
  }, [user?.id, favoriteIds, fetchFavorites]);

  const isFavorite = useCallback((trackId: string) => favoriteIds.has(trackId), [favoriteIds]);

  return { favorites, loading, error, toggleFavorite, isFavorite, refetch: fetchFavorites };
};