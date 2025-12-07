export const metadata = {
  title: "ColorHackers AI Backend",
  description: "Backend API for generating silo realms"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
