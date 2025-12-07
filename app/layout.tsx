export const metadata = {
  title: "ColorHackers Backend",
  description: "API service for ColorHackers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
