import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main style={{ background: 'var(--pm-paper)' }}>{children}</main>
      <Footer />
    </>
  );
}
