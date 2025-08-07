import { useState } from "react";
import { Link, useLocation } from "wouter";
import { WalletConnection } from "../wallet-connection";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBlockchain } from "@/hooks/use-blockchain";

export function Header() {
  const [location] = useLocation();
  const { userRole } = useBlockchain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Register Drug", href: "/register" },
    { name: "Verify", href: "/verify" },
    { name: "Track Supply Chain", href: "/track" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location === href;
  };

  return (
    <header className="bg-surface shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-pills text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-neutral">DrugAuth</h1>
            </Link>
            
            <nav className="hidden md:flex space-x-6 ml-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`transition-colors ${
                    isActive(item.href)
                      ? "text-primary font-medium border-b-2 border-primary pb-1"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <WalletConnection />
            
            {userRole && (
              <div className="hidden sm:block px-3 py-1.5 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium text-primary capitalize">
                  {userRole}
                </span>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <i className="fas fa-network-wired text-blue-600 text-xs"></i>
              <span className="text-sm text-blue-700 font-medium">Goerli</span>
            </div>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden p-2 text-gray-600 hover:text-primary"
                >
                  <i className="fas fa-bars"></i>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-gray-600 hover:text-primary hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
