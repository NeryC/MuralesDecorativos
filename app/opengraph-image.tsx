import { ImageResponse } from "next/og";
import { getMuralesStats } from "@/lib/queries/murales";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Murales Políticos — Registro de propaganda política en Paraguay";

export default async function Image() {
  const stats = await getMuralesStats();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        background: "#0F172A",
        color: "#FFFFFF",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.7, display: "flex" }}>
        Murales Políticos · Paraguay
      </div>
      <div style={{ fontSize: 96, fontWeight: 700, marginTop: 16, display: "flex" }}>
        {stats.aprobados} murales registrados
      </div>
      <div style={{ fontSize: 28, marginTop: 24, opacity: 0.85, display: "flex" }}>
        Mapa colaborativo de propaganda política
      </div>
    </div>,
    { ...size },
  );
}
