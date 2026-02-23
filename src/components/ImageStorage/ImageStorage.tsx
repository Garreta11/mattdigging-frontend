import { useStorageUrl } from '../../hooks/useStorageUrl';

interface StorageImageProps {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  localFile?: File | null;
}

const ImageStorage = ({ bucket, path, alt, className, localFile }: StorageImageProps) => {
  const url = useStorageUrl(bucket, path, localFile);

  if (!url) return null;

  return <img src={url} alt={alt} className={className} loading="lazy" />;
};

export default ImageStorage;