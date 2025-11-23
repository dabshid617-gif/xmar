import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import ProductForm from "./pages/ProductForm";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import BusinessType from "./pages/BusinessType";
import Settings from "./pages/Settings";
import Receipts from "./pages/Receipts";
import OrderDetails from "./pages/OrderDetails";
import PosDashboard from "@/pages/pos/Dashboard";
import NotFound from "./pages/NotFound";
import Category from "./pages/Category";
import SalesOrder from "./pages/SalesOrder";
import PosIndex from "@/pages/pos/Index";
import PosInventory from "@/pages/pos/Inventory";
import PosNotFound from "@/pages/pos/NotFound";
import Conversations from "./pages/Conversations";
import InventoryPage from "./pages/InventoryPage";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                <Route path="/auth" element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                <Route path="/profile/:userId" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
                <Route path="/products/:productId" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
                <Route path="/sell" element={<ErrorBoundary><BusinessType /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                <Route path="/receipts" element={<ErrorBoundary><Receipts /></ErrorBoundary>} />
                <Route path="/orders/:orderId" element={<ErrorBoundary><OrderDetails /></ErrorBoundary>} />
                {/** AI page removed */}
                <Route path="/products/:productId/edit" element={<ErrorBoundary><ProductForm /></ErrorBoundary>} />
                <Route path="/sales/new" element={<ErrorBoundary><SalesOrder /></ErrorBoundary>} />
                <Route path="/conversations" element={<ErrorBoundary><Conversations /></ErrorBoundary>} />
                <Route path="/chat/:userId" element={<ErrorBoundary><Chat /></ErrorBoundary>} />
                <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/category/:categoryName" element={<ErrorBoundary><Category /></ErrorBoundary>} />
                <Route path="/category" element={<ErrorBoundary><Category /></ErrorBoundary>} />
                {/* POS app routes (migrated from pos/) */}
                <Route path="/pos" element={<ErrorBoundary><PosIndex /></ErrorBoundary>} />
                <Route path="/pos/dashboard" element={<ErrorBoundary><PosDashboard /></ErrorBoundary>} />
                <Route path="/pos/inventory" element={<ErrorBoundary><PosInventory /></ErrorBoundary>} />
                <Route path="/inventory" element={<ErrorBoundary><InventoryPage /></ErrorBoundary>} />
                <Route path="/pos/*" element={<ErrorBoundary><PosNotFound /></ErrorBoundary>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              {/* Convenience redirect so older links /products/new work */}
              <Route path="/products/new" element={<Navigate to="/products/new/edit" replace />} />
              <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
              </Routes>
            </main>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
