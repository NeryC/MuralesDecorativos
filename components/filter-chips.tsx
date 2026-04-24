"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Estado = "todos" | "aprobado" | "modificado";

const items: { value: Estado; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "aprobado", label: "Aprobados" },
  { value: "modificado", label: "Modificados" },
];

export function FilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (searchParams.get("estado") ?? "todos") as Estado;

  const handleChange = useCallback(
    (value: string) => {
      if (!value) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value === "todos") params.delete("estado");
      else params.set("estado", value);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={handleChange}
      disabled={isPending}
      variant="outline"
      size="sm"
      aria-label="Filtrar por estado"
    >
      {items.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value} aria-label={item.label}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
