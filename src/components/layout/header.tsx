import { ModeToggle } from "@/components/layout/mode-toggle";
import { LayoutDashboard, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    <span className="text-xl tracking-tight">Kanban Task Manager</span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <Link href="/history">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <History className="h-4 w-4" />
                            <span className="hidden sm:inline">Lịch sử</span>
                        </Button>
                    </Link>
                    <ModeToggle />
                </div>
            </div>
        </header>
    );
}
