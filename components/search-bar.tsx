"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const commit = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  const onChange = (next: string) => {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(next), 300);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nombre, candidato o ubicación..."
        aria-label="Buscar murales"
        className="pl-9"
      />
    </div>
  );
}
