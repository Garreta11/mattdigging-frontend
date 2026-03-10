import './UserInfo.scss';
import { useAppContext } from '../../context/AppContext';

const UserInfo = ({ onClick }: { onClick: () => void }) => {
  const { user } = useAppContext();
  return (
    <div className="userinfo" onClick={onClick}>
      {user?.image ? (
        <img className="userinfo__image" src={user?.image} alt="User" />
      ) : (
        <div className="userinfo__image userinfo__image--default">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="userinfo__name">{user?.email?.split('@')[0]}</p>
    </div>
  );
};

export default UserInfo;