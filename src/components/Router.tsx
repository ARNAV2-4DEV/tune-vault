import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import Layout from '@/components/Layout';
import HomePage from '@/components/pages/HomePage';
import TopChartsPage from '@/components/pages/TopChartsPage';
import PlaylistsPage from '@/components/pages/PlaylistsPage';
import PlaylistDetailPage from '@/components/pages/PlaylistDetailPage';
import SongDetailPage from '@/components/pages/SongDetailPage';
import ProfilePage from '@/components/pages/ProfilePage';
import UploadPage from '@/components/pages/UploadPage';
import MyMusicPage from '@/components/pages/MyMusicPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />, // MIXED ROUTE: Shows different content for authenticated vs anonymous users
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
        path: "profile",
        element: (
          <MemberProtectedRoute>
            <ProfilePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "upload",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to upload your music">
            <UploadPage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "my-music",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to view your music library">
            <MyMusicPage />
          </MemberProtectedRoute>
        ),
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
