import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >

      <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>
        Welcome to MediaNest
      </h1>

      <p style={{ fontSize: "18px", maxWidth: "600px", marginBottom: "32px" }}>
        Your personal second brain. Save, organize, and revisit your favorite
        YouTube videos and X posts — all in one place.
      </p>

      <div style={{ display: "flex", gap: "16px" }}>
        <button
          onClick={() => navigate("/signup")}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "black",
            color:"white"
          }}
        >
          Sign Up
        </button>

        <button
          onClick={() => navigate("/signin")}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid white",
            cursor: "pointer",
            backgroundColor: "black",
            color: "white"
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
};