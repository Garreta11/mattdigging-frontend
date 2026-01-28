import './UserInfo.scss';
import { useAppContext } from '../../context/AppContext';
const UserInfo = () => {
  const { user, setUser, setIsAuthed } = useAppContext();
  return (
    <div className="userinfo">
      <img className="userinfo__image" src={user?.image} alt="User" />
      <p className="userinfo__name">{user?.name}</p>
    </div>
  );
};

export default UserInfo;