import './Loader.scss';

type Props = {
  fading?: boolean;
  fullscreen?: boolean;
};

const Loader = ({ fading = false, fullscreen = false }: Props) => {
  const classes = [
    'loader',
    fullscreen ? 'loader--fullscreen' : '',
    fading ? 'loader--fading' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <img className="loader__logo" src="/svg/logo-color.svg" alt="Loading" />
    </div>
  );
};

export default Loader;
