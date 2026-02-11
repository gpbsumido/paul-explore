// wraps page content in a centered page/main structure
export default function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <main>{children}</main>
    </div>
  );
}
