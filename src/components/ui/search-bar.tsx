"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Tìm kiếm công việc..." }: SearchBarProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
                ref={inputRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9 h-9"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full"
                    onClick={() => {
                        onChange("");
                        inputRef.current?.focus();
                    }}
                >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Xóa tìm kiếm</span>
                </Button>
            )}
        </div>
    );
}
