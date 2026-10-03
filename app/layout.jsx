import './globals.css';

export const metadata = {
  title: 'Customer App',
  description: 'Customer CRUD with Next.js and MongoDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
