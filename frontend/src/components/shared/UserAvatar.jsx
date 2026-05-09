import { getInitials, resolveMediaUrl } from "../../utils/media.js";

export default function UserAvatar({
  alt,
  className = "",
  imageClassName = "",
  labelClassName = "",
  src,
  text
}) {
  const resolvedSource = resolveMediaUrl(src);
  const combinedClassName = className ? `user-avatar ${className}` : "user-avatar";

  if (resolvedSource) {
    return (
      <div className={combinedClassName}>
        <img className={imageClassName} src={resolvedSource} alt={alt || text || "User avatar"} />
      </div>
    );
  }

  return (
    <div className={combinedClassName} aria-hidden="true">
      <span className={labelClassName}>{getInitials(text)}</span>
    </div>
  );
}
