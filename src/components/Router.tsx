import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import HomePage from '@/components/pages/HomePage';
import TopChartsPage from '@/components/pages/TopChartsPage';
import PlaylistsPage from '@/components/pages/PlaylistsPage';
import PlaylistDetailPage from '@/components/pages/PlaylistDetailPage';
import SongDetailPage from '@/components/pages/SongDetailPage';

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "top-charts",
        element: <TopChartsPage />,
      },
      {
        path: "playlists",
        element: <PlaylistsPage />,
      },
      {
        path: "playlist/:id",
        element: <PlaylistDetailPage />,
      },
      {
        path: "song/:id",
        element: <SongDetailPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
