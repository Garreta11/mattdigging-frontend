import SignIn from "../../components/SignIn/SignIn";
import './Login.scss';
import { useEffect } from "react";
import { useAppContext } from "../../context/AppContext";

const Login = () => {

  const { setIsSearchModalOpen } = useAppContext();

  useEffect(() => {
    setIsSearchModalOpen(true)
  }, []);

  return (
    <div className="login">
      <SignIn />
    </div>
  );
};

export default Login;