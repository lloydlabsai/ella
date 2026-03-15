import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";
import { useMLAnalysis } from "./hooks/useMLAnalysis";
import AuthForm from "./components/AuthForm";
import Layout from "./components/Layout";
import Capture from "./pages/Capture";
import Database from "./pages/Database";
import Analyze from "./pages/Analyze";
import Generate from "./pages/Generate";
import Settings from "./pages/Settings";

export default function App() {
  const auth = useAuth();
  const posts = usePosts(auth.user?.id);
  const mlAnalysis = useMLAnalysis(auth.user?.id);

  if (auth.loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0c0c10", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🦜</div>
          <div style={{ color: "#E8A838", fontSize: 14, fontWeight: 600 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return <AuthForm onSignIn={auth.signIn} onSignUp={auth.signUp} />;
  }

  return (
    <BrowserRouter>
      <Layout profile={auth.profile} onSignOut={auth.signOut}>
        <Routes>
          <Route path="/" element={<Capture user={auth.user} profile={auth.profile} posts={posts} />} />
          <Route path="/database" element={<Database posts={posts} />} />
          <Route path="/analyze" element={<Analyze posts={posts} mlAnalysis={mlAnalysis} />} />
          <Route path="/generate" element={<Generate profile={auth.profile} mlResults={mlAnalysis.results} />} />
          <Route path="/settings" element={<Settings profile={auth.profile} updateProfile={auth.updateProfile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
