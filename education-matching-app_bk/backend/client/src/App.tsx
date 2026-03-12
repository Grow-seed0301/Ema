import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import TeachersPage from "@/pages/teachers";
import LessonsPage from "@/pages/lessons";
import PaymentsPage from "@/pages/payments";
import PlansPage from "@/pages/plans";
import InquiriesPage from "@/pages/inquiries";
import ContentManagementPage from "@/pages/content-management";
import ContentTermsPage from "@/pages/content-terms";
import ContentPrivacyPage from "@/pages/content-privacy";
import ContentAdminEmailPage from "@/pages/content-admin-email";
import ContentFaqsPage from "@/pages/content-faqs";
import ChatsPage from "@/pages/chats";
import ChatDetailPage from "@/pages/chat-detail";
import SubjectsPage from "@/pages/subjects";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/users" component={UsersPage} />
      <Route path="/teachers" component={TeachersPage} />
      <Route path="/lessons" component={LessonsPage} />
      <Route path="/payments" component={PaymentsPage} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/inquiries" component={InquiriesPage} />
      <Route path="/content" component={ContentManagementPage} />
      <Route path="/content/terms" component={ContentTermsPage} />
      <Route path="/content/privacy" component={ContentPrivacyPage} />
      <Route path="/content/admin-email" component={ContentAdminEmailPage} />
      <Route path="/content/faqs" component={ContentFaqsPage} />
      <Route path="/chats" component={ChatsPage} />
      <Route path="/chats/:chatId" component={ChatDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="education-app-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
