"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { aprobarMuralAction, rechazarMuralAction } from "@/app/admin/_actions/murales";

interface MuralRowActionsProps {
  muralId: string;
}

export function MuralRowActions({ muralId }: MuralRowActionsProps) {
  const [pending, startTransition] = useTransition();
  const [openReject, setOpenReject] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const res = await aprobarMuralAction(muralId);
      if (res.success) toast.success("Mural aprobado");
      else toast.error(res.error);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rechazarMuralAction(muralId, motivo);
      if (res.success) {
        toast.success("Mural rechazado");
        setOpenReject(false);
        setMotivo("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={pending}
        className="bg-success hover:bg-success/90 text-success-foreground"
      >
        <Check className="size-4" aria-hidden="true" />
        Aprobar
      </Button>

      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            <X className="size-4" aria-hidden="true" />
            Rechazar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar mural</DialogTitle>
            <DialogDescription>
              Indicá un motivo (opcional). Se registrará en la auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: imagen fuera de foco, información incorrecta..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReject(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={pending}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
