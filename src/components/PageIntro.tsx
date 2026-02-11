// heading + subtitle block used on most pages
export default function PageIntro({
  heading,
  subtitle,
  className,
}: {
  heading: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1>{heading}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
