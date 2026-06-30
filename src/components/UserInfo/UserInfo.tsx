import './UserInfo.scss';
import { useAppContext } from '../../context/AppContext';

const UserInfo = ({ onClick }: { onClick: () => void }) => {
  const { user } = useAppContext();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="userinfo" onClick={onClick}>
      {user?.image ? (
        <img className="userinfo__image" src={user?.image} alt="User" />
      ) : (
        <div className="userinfo__image userinfo__image--default">
          {initials}
        </div>
      )}

      <p className="userinfo__name">
        {user?.name || user?.email?.split('@')[0]}
      </p>
    </div>
  );
};

export default UserInfo;