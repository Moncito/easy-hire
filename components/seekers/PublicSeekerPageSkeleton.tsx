import type { CSSProperties } from "react";

function Bone({ style }: { style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#E4E2DC",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export default function PublicSeekerPageSkeleton() {
  return (
    <div
      className="animate-fade-in"
      style={{
        background: "#F5F4F0",
        minHeight: "100vh",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        className="seekers-nav-band"
        style={{
          position: "relative",
          display: "flex",
          height: 56,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
        }}
      >
        <Bone style={{ height: 16, width: 144, borderRadius: 4 }} />
        <Bone style={{ height: 24, width: 96, borderRadius: 9999 }} />
      </div>

      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 1.5rem 4rem",
        }}
      >
        <Bone style={{ height: 14, width: 112, borderRadius: 4, margin: "1.5rem 0" }} />

        <Bone
          style={{
            width: "100%",
            height: 192,
            borderRadius: "14px 14px 0 0",
            background: "linear-gradient(118deg, #20242B 0%, #1E3A5F 32%, #1F8073 68%, #F2A93B 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1.125rem",
            paddingBottom: "1.5rem",
          }}
        >
          <Bone
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              border: "4px solid #FFFFFF",
              flexShrink: 0,
              marginTop: -48,
              boxSizing: "border-box",
            }}
          />
          <div style={{ paddingTop: 16, flex: 1 }}>
            <Bone style={{ height: 22, width: 220, borderRadius: 4, marginBottom: 8 }} />
            <Bone style={{ height: 14, width: 140, borderRadius: 4 }} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            background: "#FFFFFF",
            border: "1px solid #E4E2DC",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 130px",
                padding: "1.25rem 1rem",
                borderRight: i < 4 ? "1px solid #E4E2DC" : "none",
              }}
            >
              <Bone style={{ height: 10, width: 64, borderRadius: 4, marginBottom: 8 }} />
              <Bone style={{ height: 16, width: 96, borderRadius: 4, marginBottom: 6 }} />
              <Bone style={{ height: 10, width: 72, borderRadius: 4 }} />
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: "2rem",
            paddingTop: "2rem",
          }}
        >
          <div>
            <Bone style={{ height: 12, width: 72, borderRadius: 4, marginBottom: 16 }} />
            <Bone style={{ height: 14, width: "100%", borderRadius: 4, marginBottom: 8 }} />
            <Bone style={{ height: 14, width: "88%", borderRadius: 4, marginBottom: 8 }} />
            <Bone style={{ height: 14, width: "72%", borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E2DC",
                borderRadius: 10,
                padding: "1.25rem",
              }}
            >
              <Bone style={{ height: 12, width: 120, borderRadius: 4, marginBottom: 12 }} />
              <Bone style={{ height: 28, width: 96, borderRadius: 7 }} />
            </div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E2DC",
                borderRadius: 10,
                padding: "1.25rem",
              }}
            >
              <Bone style={{ height: 12, width: 80, borderRadius: 4, marginBottom: 12 }} />
              <Bone style={{ height: 28, width: 140, borderRadius: 7 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
