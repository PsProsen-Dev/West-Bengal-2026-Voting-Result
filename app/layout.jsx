import './style.css';

export const metadata = {
  title: 'West Bengal 2026 Voting Result | ECI Official Data',
  description: 'West Bengal party-wise election result dashboard using only the official Election Commission of India result page.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
