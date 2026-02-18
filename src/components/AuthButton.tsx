// login or logout link styled as a CTA
// uses <a> instead of <Link> since these routes go through the auth proxy
export default function AuthButton({
  loggedIn,
  className,
  style,
}: {
  loggedIn: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a
      className={className}
      style={style}
      href={loggedIn ? "/auth/logout" : "/auth/login"}
    >
      {loggedIn ? "Log out" : "Log in"}
    </a>
  );
}
