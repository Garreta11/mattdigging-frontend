import { Children, Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCamera,
  FiCheck,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiHeart,
  FiHelpCircle,
  FiInfo,
  FiLogOut,
  FiPlay,
  FiShield,
  FiStar,
  FiTrash2,
} from "react-icons/fi";
import TrackItem from "../../components/TrackItem/TrackItem";
import CloseButton from "../../components/CloseButton/CloseButton";
import { useAppContext } from "../../context/AppContext";
import { useFavorites } from "../../hooks/useFavorites";
import { supabase } from "../../lib/supabase";
import { Track, deleteAccount, fetchBillingPortal } from "../../services/api";
import "./Profile.scss";

// Same layout as the Profile screen in the mobile app: account header,
// latest favourites, then settings-style groups (Account, Mattdigging).

// Profile shows the latest few favourites; "See all" expands the full list.
const FAVORITES_PREVIEW = 5;
const FAVORITES_PLAYLIST = { name: "Favorite Tracks", url: "/favorites" };

const getAccessToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
};

// Same as the header's logout: forget the session on this browser and start fresh.
const signOutLocally = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith("sb-"))
    .forEach((key) => localStorage.removeItem(key));
  supabase.auth.signOut({ scope: "local" }).catch(() => {});
  window.location.assign("/");
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, auth, isMember, setIsPricingModalOpen } = useAppContext();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate("/"), 1000);
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const { url } = await fetchBillingPortal(token);
      // Same-tab redirect — window.open('_blank') after an await is blocked by
      // iOS Safari's popup blocker (no user-gesture context). Stripe returns here.
      window.location.assign(url);
    } catch (err: any) {
      setError(err.message || "Could not open the billing portal.");
      setPortalLoading(false);
    }
  };

  const memberSince = auth?.profile?.member_since
    ? new Date(auth.profile.member_since).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className={`profile main-content ${isFadingOut ? "fade-out" : ""}`}>
      <CloseButton onClick={handleClose} />

      <div className="profile__inner">
        {user ? <AccountHeader onError={setError} /> : <Welcome />}

        {error && <p className="profile__error">{error}</p>}

        <div className="profile__columns">
          {isMember && <FavoritesPreview />}

          <div className="profile__settings">
            {user && (
              <ListGroup title="Account">
                {isMember && memberSince ? (
                  <ListRow icon={<FiCalendar />} title="Member since" subtitle={memberSince} />
                ) : null}
                {isMember ? (
                  <ListRow
                    icon={<FiCreditCard />}
                    title={portalLoading ? "Opening billing portal…" : "Manage subscription"}
                    subtitle="Change plan, payment method or cancel"
                    onClick={portalLoading ? undefined : handleBillingPortal}
                  />
                ) : (
                  <ListRow
                    icon={<FiStar />}
                    title="Become a member"
                    subtitle="Explore the whole archive"
                    accent
                    onClick={() => setIsPricingModalOpen(true)}
                  />
                )}
                <ListRow icon={<FiLogOut />} title="Log out" danger onClick={signOutLocally} />
                <ListRow
                  icon={<FiTrash2 />}
                  title="Delete account"
                  subtitle="Permanently delete your account and data"
                  danger
                  onClick={() => setIsDeleteOpen(true)}
                />
              </ListGroup>
            )}

            <ListGroup title="Mattdigging">
              <ListRow to="/about" icon={<FiInfo />} title="About" subtitle="The story behind the collection" />
              <ListRow to="/terms" icon={<FiFileText />} title="Terms & Conditions" subtitle="English · Deutsch" />
              <ListRow to="/privacy" icon={<FiShield />} title="Privacy Policy" />
              <ListRow to="/support" icon={<FiHelpCircle />} title="Support" subtitle="Questions, feedback, the app" />
            </ListGroup>

            <p className="profile__footer">Mattdigging</p>
          </div>
        </div>
      </div>

      {isDeleteOpen && <DeleteAccountDialog onClose={() => setIsDeleteOpen(false)} />}
    </section>
  );
};

// Avatar (click to change), @username (click to edit), email and membership badge.
function AccountHeader({ onError }: { onError: (message: string | null) => void }) {
  const { user, setUser, auth, isMember } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState(user?.username || "");

  const email = user?.email || "";
  const initial = (user?.username || user?.name || email || "?").charAt(0).toUpperCase();
  const plan = auth?.profile?.subscription_type;
  const avatar = avatarPreview || user?.image;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    onError(null);
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
      onError(err.message || "Failed to upload image.");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setUsername(user?.username || "");
  };

  const saveUsername = async () => {
    const value = username.trim().replace(/^@/, "");
    if (value === (user?.username || "")) return cancelEdit();
    setIsSaving(true);
    onError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ data: { username: value } });
      if (updateError) throw updateError;
      if (user) setUser({ ...user, username: value });
      setUsername(value);
    } catch (err: any) {
      onError(err.message || "Failed to save.");
      setUsername(user?.username || "");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="profile__header">
      <button
        type="button"
        className={`profile__avatar ${avatarUploading ? "profile__avatar--loading" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Change profile picture"
        title="Change profile picture"
      >
        {avatar ? (
          <img className="profile__avatar__image" src={avatar} alt="" />
        ) : (
          <span className="profile__avatar__initial">{initial}</span>
        )}
        <span className="profile__avatar__overlay">
          {avatarUploading ? <span className="profile__avatar__spinner" /> : <FiCamera size={20} />}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="profile__avatar__input"
          onChange={handleAvatarChange}
        />
      </button>

      <div className="profile__header__texts">
        {isEditing ? (
          <div className="profile__username-edit">
            <span className="profile__username-edit__at">@</span>
            <input
              autoFocus
              className="profile__username-edit__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveUsername();
                if (e.key === "Escape") cancelEdit();
              }}
              placeholder="username"
              aria-label="Username"
            />
            <button
              type="button"
              className="profile__username-edit__confirm"
              onClick={saveUsername}
              disabled={isSaving}
              aria-label="Save username"
            >
              <FiCheck size={14} />
            </button>
          </div>
        ) : (
          <h2 className="profile__name">
            <button
              type="button"
              className="profile__name__button"
              onClick={() => setIsEditing(true)}
              title="Edit username"
            >
              {user?.username ? `@${user.username}` : email}
              <span className="profile__name__hint">{user?.username ? "Edit" : "Add username"}</span>
            </button>
          </h2>
        )}
        {user?.username ? <p className="profile__email">{email}</p> : null}
        <span className={`profile__badge ${isMember ? "profile__badge--member" : ""}`}>
          {isMember ? `Member${plan ? ` · ${plan}` : ""}` : "Free account"}
        </span>
      </div>
    </div>
  );
}

// Logged out: a short welcome instead of an empty account section.
function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="profile__welcome">
      <img className="profile__welcome__logo" src="/svg/logo-color.svg" alt="Mattdigging" />
      <h2 className="profile__welcome__title">Welcome, digger</h2>
      <p className="profile__welcome__text">
        Log in to keep your favourite tracks and, as a member, explore the whole archive.
      </p>
      <button type="button" className="profile__welcome__button" onClick={() => navigate("/login")}>
        Log in
      </button>
    </div>
  );
}

// Latest favourites with "Play all"; the full list is one click away.
function FavoritesPreview() {
  const { setPlayerTrackList, setPlaylist, setTrack, track: currentTrack } = useAppContext();
  const { favorites, loading } = useFavorites();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? favorites : favorites.slice(0, FAVORITES_PREVIEW);

  // Plays all favourites, starting from `track`.
  const playFrom = async (track: Track) => {
    setPlaylist(FAVORITES_PLAYLIST);
    setPlayerTrackList(favorites);
    await new Promise((resolve) => setTimeout(resolve, 0));
    setTrack(track);
  };

  return (
    <div className="profile__favorites">
      <div className="profile__section-header">
        <h3 className="profile__label">Favourite tracks</h3>
        {favorites.length > 0 && (
          <button type="button" className="profile__play-all" onClick={() => playFrom(favorites[0])}>
            <FiPlay size={14} />
            Play all
          </button>
        )}
      </div>

      {loading && favorites.length === 0 ? (
        <div className="profile__empty">
          <span className="profile__spinner" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="profile__empty">
          <FiHeart size={20} />
          <p>No favourites yet. Click the ♡ on any track to save it here.</p>
        </div>
      ) : (
        <>
          <ul className="profile__favorites__list">
            {shown.map((track, index) => (
              <TrackItem
                key={track.id}
                track={track}
                index={index}
                onClick={() => playFrom(track)}
                isPlaying={currentTrack?.id === track.id}
              />
            ))}
          </ul>
          {favorites.length > FAVORITES_PREVIEW && (
            <button
              type="button"
              className={`profile__see-all ${showAll ? "profile__see-all--open" : ""}`}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show less" : `See all ${favorites.length} favourites`}
              <FiChevronRight size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Settings-style grouped list: a small title above one rounded block of rows,
// with thin dividers between them (same as ListGroup in the mobile app).
function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <div className="profile__group">
      {title ? <h3 className="profile__label">{title}</h3> : null}
      <div className="profile__group__block">
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <div className="profile__group__divider" />}
            {row}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

type ListRowProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Page to open. */
  to?: string;
  /** Custom action instead of navigating. */
  onClick?: () => void;
  /** Red, for actions like "Log out". */
  danger?: boolean;
  /** Green, for the call to action. */
  accent?: boolean;
};

// Rows without `to`/`onClick` are plain information: no chevron, not clickable.
function ListRow({ icon, title, subtitle, to, onClick, danger, accent }: ListRowProps) {
  const className = [
    "profile__row",
    danger && "profile__row--danger",
    accent && "profile__row--accent",
    (to || onClick) && "profile__row--interactive",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="profile__row__icon">{icon}</span>
      <span className="profile__row__texts">
        <span className="profile__row__title">{title}</span>
        {subtitle ? <span className="profile__row__subtitle">{subtitle}</span> : null}
      </span>
      {(to || onClick) && !danger ? <FiChevronRight className="profile__row__chevron" size={18} /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

// Two-step confirmation, because deleting the account cannot be undone.
function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { isMember } = useAppContext();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleting, onClose]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Your session has expired. Please log in again.");
      await deleteAccount(token);
      // The user no longer exists: forget the login in this browser.
      signOutLocally();
    } catch (err: any) {
      setError(err.message || "Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div
      className="profile-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div className="profile-dialog" role="alertdialog" aria-modal="true" aria-labelledby="profile-dialog-title">
        <h2 className="profile-dialog__title" id="profile-dialog-title">
          Delete account?
        </h2>
        <p className="profile-dialog__text">
          Your account, favourites and login will be deleted permanently. This cannot be undone.
        </p>
        {isMember && (
          <p className="profile-dialog__text">Your membership will be cancelled immediately and will not renew.</p>
        )}
        {error && (
          <p className="profile__error">
            {error} You can also write to <a href="mailto:mattdigging@gmx.de">mattdigging@gmx.de</a>.
          </p>
        )}
        <div className="profile-dialog__actions">
          <button type="button" className="profile-dialog__button" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="profile-dialog__button profile-dialog__button--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
