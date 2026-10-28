import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { cloudinaryThumb, initials } from "@/lib/team-avatar";

type Props = {
  name: string;
  photoUrl?: string | null;
  /** Display size in px (24–112). */
  size?: number;
  className?: string;
};

/** Team member photo, or initials on a light gold circle when there is none or it fails to load (spec 005). */
const TeamAvatar = ({ name, photoUrl, size = 48, className }: Props) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoUrl]);

  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };
  if (photoUrl && !failed) {
    return (
      <img
        src={cloudinaryThumb(photoUrl, size)}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover bg-gold/10", className)}
        style={style}
      />
    );
  }
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-gold/10 font-semibold text-gold-strong", className)}
      style={style}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
};

export default TeamAvatar;
