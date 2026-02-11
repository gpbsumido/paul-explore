// login or logout link styled as a CTA
// uses <a> instead of <Link> since these routes go through the auth proxy
export default function AuthButton({
  loggedIn,
  className,
}: {
  loggedIn: boolean;
  className?: string;
}) {
  return (
    <a className={className} href={loggedIn ? "/auth/logout" : "/auth/login"}>
      {loggedIn ? "Log out" : "Log in"}
    </a>
  );
}
