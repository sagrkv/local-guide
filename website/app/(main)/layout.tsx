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
      <main className="ml-0 lg:ml-[80px]">{children}</main>
      <Footer />
    </>
  );
}
