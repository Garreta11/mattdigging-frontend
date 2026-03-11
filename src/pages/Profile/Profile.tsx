import './Profile.scss';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../hooks/useFavorites';
import ImageStorage from '../../components/ImageStorage/ImageStorage';
import TrackItem from '../../components/TrackItem/TrackItem';
import { Track } from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, setPlayerTrackList, setPlaylist, setTrack, track: currentTrack } = useAppContext();
  const { favorites, loading: favoritesLoading, toggleFavorite } = useFavorites();

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
  });

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user?.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;
      if (user) setUser({ ...user, image: publicUrl });
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveField = async (field: 'name' | 'username') => {
    setIsSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ data: { [field]: formData[field] } });
      if (updateError) throw updateError;
      if (user) setUser({ ...user, [field]: formData[field] });
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
      setFormData({ ...formData, [field]: (user as any)?.[field] || '' });
    } finally {
      setIsSaving(false);
      if (field === 'name') setIsEditingName(false);
      if (field === 'username') setIsEditingUsername(false);
    }
  };

  const handlePlayFavorites = () => {
    if (favorites.length > 0) {
      setPlayerTrackList(favorites);
      setPlaylist({ name: 'Favorite Tracks', url: '/favorites' });
    }
  };

  const handleTrackClick = async (track: Track) => {
    setPlaylist({ name: 'Favorite Tracks', url: '/favorites' });
  
    setPlayerTrackList(favorites);
    await new Promise(resolve => setTimeout(resolve, 0));
    setTrack(track);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <section className={`profile main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button
          className="main-content__close__button main-content__close__button--reverse"
          onClick={handleClose}
        >
          <svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)" />
          </svg>
        </button>
      </div>

      <div className="profile__inner">

        {/* ── Hero ── */}
        <div className="profile__hero">

          {/* Avatar */}
          <div className={`profile__avatar-wrap ${avatarUploading ? 'profile__avatar-wrap--loading' : ''}`} onClick={handleAvatarClick}>
            {avatarPreview || user?.image ? (
              <img className="profile__avatar" src={avatarPreview || user?.image} alt={user?.name || 'Avatar'} />
            ) : (
              <div className="profile__avatar profile__avatar--initials">{initials}</div>
            )}
            <div className="profile__avatar-overlay">
              {avatarUploading ? (
                <div className="profile__avatar-overlay__spinner" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="profile__avatar-input" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="profile__info">

            {isEditingName ? (
              <div className="profile__inline-edit">
                <input
                  autoFocus
                  className="profile__inline-edit__input profile__inline-edit__input--name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveField('name');
                    if (e.key === 'Escape') { setIsEditingName(false); setFormData({ ...formData, name: user?.name || '' }); }
                  }}
                  placeholder="Display name"
                />
                <button className="profile__inline-edit__confirm" onClick={() => handleSaveField('name')} disabled={isSaving}>✓</button>
              </div>
            ) : (
              <h2 className="profile__name" onClick={() => setIsEditingName(true)}>
                {user?.name || <span className="profile__placeholder">Add name</span>}
                <span className="profile__edit-hint">✎</span>
              </h2>
            )}

            {isEditingUsername ? (
              <div className="profile__inline-edit profile__inline-edit--username">
                <span className="profile__inline-edit__at">@</span>
                <input
                  autoFocus
                  className="profile__inline-edit__input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveField('username');
                    if (e.key === 'Escape') { setIsEditingUsername(false); setFormData({ ...formData, username: user?.username || '' }); }
                  }}
                  placeholder="username"
                />
                <button className="profile__inline-edit__confirm" onClick={() => handleSaveField('username')} disabled={isSaving}>✓</button>
              </div>
            ) : (
              <p className="profile__username" onClick={() => setIsEditingUsername(true)}>
                {user?.username ? `@${user.username}` : <span className="profile__placeholder">@username</span>}
                <span className="profile__edit-hint">✎</span>
              </p>
            )}

            <p className="profile__email">{user?.email}</p>
            <p className="profile__member-since">
              Member since {user?.createdAt?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>

          </div>
        </div>

        {error && <p className="profile__error">{error}</p>}

        {/* ── Favorite Tracks ── */}
        <div className="profile__favorites">
          <div className="profile__favorites__header">
            <h3 className="profile__favorites__title">Favorite Tracks</h3>
            <button className="profile__favorites__play" onClick={handlePlayFavorites}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="var(--color-white)"/>
              </svg>
            </button>
          </div>

          {favoritesLoading ? (
            <p className="profile__favorites__empty">Loading…</p>
          ) : favorites.length === 0 ? (
            <p className="profile__favorites__empty">No favorites yet. Heart a track to save it here.</p>
          ) : (
            <ul className="profile__favorites__list">
              {favorites.map((track, index) => (
                <TrackItem key={track.id} track={track} index={index} onClick={() => handleTrackClick(track)} isPlaying={currentTrack?.id === track.id} />
              ))}
            </ul>
          )}
        </div>

      </div>
    </section>
  );
};

export default Profile;