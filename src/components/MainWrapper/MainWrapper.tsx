import { useLocation } from 'react-router-dom';

const MainWrapper = ({ children }: { children: React.ReactNode }) => {

  const location = useLocation();

  return (
    <div className={`main__wrapper${location.pathname !== '/' ? ' main__wrapper--page' : ''}`}>
      {children}
    </div>
  );
};

export default MainWrapper;