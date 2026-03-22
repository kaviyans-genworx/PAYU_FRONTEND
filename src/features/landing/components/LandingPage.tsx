import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, ShieldCheck, Zap } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-md">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">PAYU</span>
        </div>
        <Button onClick={() => navigate("/login")} variant="default">
          Log In
        </Button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Zap className="mr-1 h-3 w-3" /> AP Automation Reimagined
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            Streamline your <span className="text-primary">Accounts Payable</span>
          </h1>
          <p className="mt-6 text-lg tracking-tight text-slate-600 max-w-2xl mx-auto">
            PAYU automatically fetches invoices from emails, performs smart 2-way matching against purchase orders,
            and highlights discrepancies in a dedicated validation interface.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login")} className="gap-2 h-12 px-8 text-base">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 px-4">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-left">
            <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">Email Ingestion & Extraction</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              Invoices are seamlessly fetched directly from your emails. Our AI engine extracts line items, totals, and metadata automatically, eliminating manual data entry.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-left">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">2-Way Smart Matching</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              Dynamically match a single invoice to a single PO (2-way), or connect N invoices to N purchase orders. Our smart matching process reconciles documents effortlessly.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border text-left">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">Validation & Discrepancy Detection</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              Review smart matches in a dedicated validation dashboard. The system instantly highlights pricing and quantity discrepancies so you are always in control.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t bg-white flex justify-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} PAYU Application. All rights reserved.
      </footer>
    </div>
  );
}
