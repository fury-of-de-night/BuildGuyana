import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import HowItWorks from "../pages/how-it-works/page";
import Contractors from "../pages/contractors/page";
import ContractorProfile from "../pages/contractors/profile/page";
import Login from "../pages/auth/login/page";
import ResetPassword from "../pages/auth/reset-password/page";
import Register from "../pages/auth/register/page";
import TradespersonDashboard from "../pages/dashboard/contractor/page";
import ProjectOwnerDashboard from "../pages/dashboard/project-owner/page";
import AdminDashboard from "../pages/dashboard/admin/page";
import PostJob from "../pages/jobs/post/page";
import SubmitQuote from "../pages/jobs/submit-quote/page";
import RequestQuote from "../pages/jobs/request-quote/page";
import ReceivedQuotes from "../pages/jobs/quotes/page";
import JobRequests from "../pages/jobs/requests/page";
import DemoTradesperson from "../pages/demo/tradesperson/page";
import DemoProjectOwner from "../pages/demo/project-owner/page";
import DemoPostJob from "../pages/demo/post-job/page";
import ControlPanel from "../pages/control-panel/page";
import VerificationPage from "../pages/control-panel/verification/page";
import MyProfile from "../pages/profile/page";
import Testimonials from "../pages/testimonials/page";
import TradespersonReviews from "../pages/tradesperson/reviews/page";
import Notifications from "../pages/notifications/page";
import Pricing from "../pages/pricing/page";
import SuccessStories from "../pages/success-stories/page";
import PublicJobs from "../pages/public-jobs/page";
import TransactionHistory from "../pages/transaction-history/page";

const routes: RouteObject[] = [
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
  },
  {
    path: "/contractors",
    element: <Contractors />,
  },
  {
    path: "/contractors/:id",
    element: <ContractorProfile />,
  },
  {
    path: "/tradesperson/:id",
    element: <ContractorProfile />,
  },
  {
    path: "/tradesperson/:id/reviews",
    element: <TradespersonReviews />,
  },
  {
    path: "/post-job",
    element: <PostJob />,
  },
  {
    path: "/submit-quote/:jobId",
    element: <SubmitQuote />,
  },
  {
    path: "/request-quote/:jobId",
    element: <RequestQuote />,
  },
  {
    path: "/jobs/:jobId/quotes",
    element: <ReceivedQuotes />,
  },
  {
    path: "/jobs/:jobId/requests",
    element: <JobRequests />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard/tradesperson",
    element: <TradespersonDashboard />,
  },
  {
    path: "/dashboard/project-owner",
    element: <ProjectOwnerDashboard />,
  },
  {
    path: "/dashboard/admin",
    element: <AdminDashboard />,
  },
  {
    path: "/demo-tradesperson",
    element: <DemoTradesperson />,
  },
  {
    path: "/demo-project-owner",
    element: <DemoProjectOwner />,
  },
  {
    path: "/demo-post-job",
    element: <DemoPostJob />,
  },
  {
    path: "/profile",
    element: <MyProfile />,
  },
  {
    path: "/bg-ops-7742",
    element: <ControlPanel />,
  },
  {
    path: "/control-panel/verification/:userId",
    element: <VerificationPage />,
  },
  {
    path: "/testimonials",
    element: <Testimonials />,
  },
  {
    path: "/notifications",
    element: <Notifications />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/success-stories",
    element: <SuccessStories />,
  },
  {
    path: "/public-jobs",
    element: <PublicJobs />,
  },
  {
    path: "/transaction-history",
    element: <TransactionHistory />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;