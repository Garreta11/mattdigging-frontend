import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrackItem from "../../components/TrackItem/TrackItem";
import { useAppContext } from "../../context/AppContext";
import { useFavorites } from "../../hooks/useFavorites";
import { supabase } from "../../lib/supabase";
import {
  Track,
  fetchBillingCheckout,
  fetchBillingPortal,
} from "../../services/api";
import "./Profile.scss";

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    setUser,
    setPlayerTrackList,
    setPlaylist,
    setTrack,
    track: currentTrack,
    auth,
    setIsPricingModalOpen
  } = useAppContext();
  const { favorites, loading: favoritesLoading } = useFavorites();

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
  });

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate("/"), 1000);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user?.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) throw updateError;
      if (user) setUser({ ...user, image: publicUrl });
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveField = async (field: "name" | "username") => {
    setIsSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { [field]: formData[field] },
      });
      if (updateError) throw updateError;
      if (user) setUser({ ...user, [field]: formData[field] });
    } catch (err: any) {
      setError(err.message || "Failed to save.");
      setFormData({ ...formData, [field]: (user as any)?.[field] || "" });
    } finally {
      setIsSaving(false);
      if (field === "name") setIsEditingName(false);
      if (field === "username") setIsEditingUsername(false);
    }
  };

  const handlePlayFavorites = async () => {
    if (favorites.length > 0) {
      setPlayerTrackList(favorites);
      setPlaylist({ name: "Favorite Tracks", url: "/favorites" });
      await new Promise((resolve) => setTimeout(resolve, 0));
      setTrack(favorites[0]);
    }
  };

  const handleTrackClick = async (track: Track) => {
    setPlaylist({ name: "Favorite Tracks", url: "/favorites" });

    setPlayerTrackList(favorites);
    await new Promise((resolve) => setTimeout(resolve, 0));
    setTrack(track);
  };

  const handleSubscribe = async () => {
    setIsPricingModalOpen(true)
  };

  const handleBillingPortal = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const { url } = await fetchBillingPortal(token);
    // Same-tab redirect — window.open('_blank') after an await is blocked by
    // iOS Safari's popup blocker (no user-gesture context). Stripe returns here.
    window.location.assign(url);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <section
      className={`profile main-content ${isFadingOut ? "fade-out" : ""}`}
    >
      <div className="main-content__close">
        <button
          className="main-content__close__button main-content__close__button--reverse"
          onClick={handleClose}
        >
          HOME
          <svg
            width="17"
            height="6"
            viewBox="0 0 17 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_47_2)">
              <path
                d="M16.898 3.1701C17.0347 3.03342 17.0347 2.81181 16.898 2.67513L14.6706 0.447756C14.5339 0.311057 14.3123 0.311057 14.1756 0.447757C14.0389 0.584422 14.0389 0.806031 14.1756 0.942716L16.1555 2.92261L14.1756 4.90251C14.0389 5.0392 14.0389 5.2608 14.1756 5.39749C14.3123 5.53417 14.5339 5.53417 14.6706 5.39749L16.898 3.1701ZM0.0567477 2.92261L0.0567477 3.27261L16.6505 3.27261L16.6505 2.92261L16.6505 2.57261L0.0567477 2.57261L0.0567477 2.92261Z"
                fill="var(--color-white)"
              />
            </g>
            <defs>
              <clipPath id="clip0_47_2">
                <rect
                  width="17"
                  height="5.5"
                  fill="white"
                  transform="translate(17 5.5) rotate(180)"
                />
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>

      <div className="profile__inner">
        {/* ── Hero ── */}
        <div className="profile__hero">
          {/* Avatar */}
          <div
            className={`profile__avatar-wrap ${avatarUploading ? "profile__avatar-wrap--loading" : ""}`}
            onClick={handleAvatarClick}
          >
            {avatarPreview || user?.image ? (
              <img
                className="profile__avatar"
                src={avatarPreview || user?.image}
                alt={user?.name || "Avatar"}
              />
            ) : (
              <div className="profile__avatar profile__avatar--initials">
                {initials}
              </div>
            )}
            <div className="profile__avatar-overlay">
              {avatarUploading ? (
                <div className="profile__avatar-overlay__spinner" />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile__avatar-input"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info */}
          <div className="profile__info">
            <div className="profile__info__header">
              {isEditingName ? (
                <div className="profile__inline-edit">
                  <input
                    autoFocus
                    className="profile__inline-edit__input profile__inline-edit__input--name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveField("name");
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setFormData({ ...formData, name: user?.name || "" });
                      }
                    }}
                    placeholder="Display name"
                  />
                  <button
                    className="profile__inline-edit__confirm"
                    onClick={() => handleSaveField("name")}
                    disabled={isSaving}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <h2
                  className="profile__name"
                  onClick={() => setIsEditingName(true)}
                >
                  {user?.name || (
                    <span className="profile__placeholder">Add name</span>
                  )}
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
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveField("username");
                      if (e.key === "Escape") {
                        setIsEditingUsername(false);
                        setFormData({
                          ...formData,
                          username: user?.username || "",
                        });
                      }
                    }}
                    placeholder="username"
                  />
                  <button
                    className="profile__inline-edit__confirm"
                    onClick={() => handleSaveField("username")}
                    disabled={isSaving}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <p
                  className="profile__username"
                  onClick={() => setIsEditingUsername(true)}
                >
                  {user?.username ? (
                    `@${user.username}`
                  ) : (
                    <span className="profile__placeholder">@username</span>
                  )}
                  <span className="profile__edit-hint">✎</span>
                </p>
              )}
            </div>

            <p className="profile__email">{user?.email}</p>

            <div className="profile__divider" />

            <div className="profile__member-since">
              <p className="profile__member-since__text">
                Member since{" "}
                {user?.createdAt?.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {auth?.profile?.subscription_type ? (
                <div className="profile__member-since__subscription">
                  Subscription: {auth?.profile?.subscription_type}
                  <button className="profile__member-since__subscription__button" onClick={handleBillingPortal}>
                    <svg width="15" height="15" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.37255 0C10.1066 0.00846 10.8377 0.0932601 11.5541 0.25304C11.8668 0.32279 12.1007 0.58351 12.1362 0.90196L12.3064 2.42881C12.3835 3.12986 12.9754 3.66084 13.681 3.66158C13.8707 3.66188 14.0583 3.62238 14.2336 3.54483L15.6342 2.92956C15.9255 2.80159 16.2659 2.87136 16.4833 3.10362C17.4955 4.18464 18.2493 5.48115 18.6881 6.89558C18.7827 7.20058 18.6738 7.53203 18.4168 7.7215L17.1753 8.6366C16.8211 8.8968 16.612 9.31 16.612 9.7495C16.612 10.1889 16.8211 10.6021 17.1761 10.8629L18.4186 11.7783C18.6757 11.9677 18.7847 12.2992 18.6901 12.6043C18.2515 14.0185 17.4981 15.3149 16.4865 16.3961C16.2693 16.6283 15.9292 16.6983 15.6379 16.5706L14.2316 15.9545C13.8292 15.7784 13.3672 15.8042 12.9869 16.024C12.6067 16.2437 12.3537 16.6312 12.3054 17.0677L12.1363 18.5944C12.1014 18.9092 11.8726 19.1682 11.5644 19.2415C10.116 19.5861 8.60685 19.5861 7.15838 19.2415C6.85026 19.1682 6.6214 18.9092 6.58653 18.5944L6.41771 17.07C6.36812 16.6343 6.11469 16.248 5.73477 16.029C5.35486 15.81 4.89355 15.7843 4.49255 15.9594L3.08592 16.5756C2.79457 16.7033 2.45438 16.6333 2.23713 16.4009C1.22497 15.3185 0.471543 14.0205 0.0335528 12.6048C-0.0607872 12.2999 0.0482129 11.9686 0.305203 11.7793L1.54853 10.8633C1.90267 10.6031 2.11182 10.1899 2.11182 9.7505C2.11182 9.311 1.90267 8.8978 1.54806 8.6373L0.305513 7.72285C0.0481528 7.53345 -0.0609472 7.20178 0.0337228 6.89658C0.472473 5.48215 1.22629 4.18564 2.23848 3.10462C2.45594 2.87236 2.79629 2.80259 3.08759 2.93056L4.48797 3.54572C4.89091 3.72256 5.35415 3.69585 5.73612 3.47269C6.11644 3.25209 6.36964 2.86422 6.41852 2.42764L6.58859 0.90196C6.62411 0.58335 6.85821 0.32254 7.17115 0.25294C7.88845 0.0934199 8.62035 0.00865 9.37255 0ZM9.37275 1.4999C8.91865 1.50524 8.46595 1.54443 8.01815 1.61702L7.90925 2.59418C7.80745 3.50368 7.28038 4.31102 6.49077 4.76903C5.69632 5.23317 4.72771 5.28903 3.88493 4.91917L2.98664 4.52456C2.41471 5.21873 1.95949 6.00135 1.63887 6.84168L2.43667 7.42879C3.17548 7.9716 3.61182 8.8337 3.61182 9.7505C3.61182 10.6672 3.17548 11.5293 2.43745 12.0715L1.6384 12.6602C1.95874 13.502 2.41403 14.2861 2.98635 14.9816L3.89148 14.5851C4.72958 14.2192 5.69159 14.2727 6.48388 14.7294C7.27616 15.1861 7.80465 15.9917 7.90835 16.9026L8.01735 17.8865C8.90695 18.0378 9.81585 18.0378 10.7055 17.8865L10.8145 16.9027C10.9153 15.9921 11.4432 15.1837 12.2364 14.7253C13.0296 14.2668 13.9936 14.213 14.8332 14.5805L15.7376 14.9767C16.3094 14.2823 16.7645 13.4995 17.0851 12.659L16.2871 12.0711C15.5483 11.5283 15.112 10.6662 15.112 9.7495C15.112 8.8327 15.5483 7.9706 16.2862 7.42847L17.0831 6.84109C16.7625 6.00061 16.3072 5.21784 15.7352 4.52356L14.8387 4.91737C14.4734 5.07901 14.0782 5.1622 13.6791 5.16158C12.2094 5.16004 10.9759 4.05355 10.8155 2.59383L10.7066 1.6167C10.2611 1.5442 9.81295 1.50512 9.37275 1.4999ZM9.36005 5.99995C11.4312 5.99995 13.1101 7.67888 13.1101 9.75C13.1101 11.821 11.4312 13.5 9.36005 13.5C7.28898 13.5 5.61005 11.821 5.61005 9.75C5.61005 7.67888 7.28898 5.99995 9.36005 5.99995ZM9.36005 7.49995C8.11745 7.49995 7.11005 8.5073 7.11005 9.75C7.11005 10.9926 8.11745 12 9.36005 12C10.6027 12 11.6101 10.9926 11.6101 9.75C11.6101 8.5073 10.6027 7.49995 9.36005 7.49995Z" fill="rgba(245, 241, 232, 0.18)"/>
                    </svg>

                  </button>
                </div>
              ) : (
                <button className="profile__member-since__subscription__subscribe" onClick={handleSubscribe}>subscribe</button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="profile__error">{error}</p>}

        {/* ── Favorite Tracks ── */}
        <div className="profile__favorites">
          <div className="profile__favorites__header">
            <h3 className="profile__favorites__title">Favorite Tracks</h3>
            <button
              className="profile__favorites__play"
              onClick={handlePlayFavorites}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 5.14286V18.8571L19 12L8 5.14286Z"
                  fill="var(--color-white)"
                />
              </svg>
            </button>
          </div>

          {favoritesLoading ? (
            <p className="profile__favorites__empty">Loading…</p>
          ) : favorites.length === 0 ? (
            <p className="profile__favorites__empty">
              No favorites yet. Heart a track to save it here.
            </p>
          ) : (
            <ul className="profile__favorites__list">
              {favorites.map((track, index) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  onClick={() => handleTrackClick(track)}
                  isPlaying={currentTrack?.id === track.id}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default Profile;
