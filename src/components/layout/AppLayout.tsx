import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  userXP?: number;
}

export default function AppLayout({ children, userXP = 0 }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-surface-DEFAULT dark:bg-surface-dark-deep overflow-hidden">
      <Sidebar userXP={userXP} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
