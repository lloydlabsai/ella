import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";
import { useMLAnalysis } from "./hooks/useMLAnalysis";
import AuthForm from "./components/AuthForm";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Generate from "./pages/Generate";
import Score from "./pages/Score";
// import Capture from "./pages/Capture";  // Disabled for free tier launch
// import Database from "./pages/Database";  // Disabled for free tier launch
import Analyze from "./pages/Analyze";
import Settings from "./pages/Settings";

export default function App() {
  const auth = useAuth();
  const posts = usePosts(auth.user?.id);
  const mlAnalysis = useMLAnalysis(auth.user?.id);

  if (auth.loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#F7F3EE", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <img src="/ella-logo.png" alt="Ella" style={{ width: 48, height: 48, objectFit: "contain", marginBottom: 12 }} />
          <div style={{ color: "#E8664A", fontSize: 14, fontWeight: 600 }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Non-logged-in users: landing page at /, auth form at /login and /signup
  if (!auth.user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthForm onSignIn={auth.signIn} onSignUp={auth.signUp} initialMode="signin" />} />
          <Route path="/signup" element={<AuthForm onSignIn={auth.signIn} onSignUp={auth.signUp} initialMode="signup" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout profile={auth.profile} onSignOut={auth.signOut}>
        <Routes>
          <Route path="/" element={<Generate profile={auth.profile} mlResults={mlAnalysis.results} postCount={posts.count} recentPosts={posts.posts?.slice(0, 6)} refreshProfile={auth.refreshProfile} />} />
          <Route path="/score" element={<Score profile={auth.profile} mlResults={mlAnalysis.results} />} />
          {/* Capture and Database routes disabled for free tier launch — redirect to home */}
          <Route path="/capture" element={<Navigate to="/" replace />} />
          <Route path="/database" element={<Navigate to="/" replace />} />
          <Route path="/analyze" element={<Navigate to="/" replace />} /> {/* Disabled for free tier launch */}
          <Route path="/settings" element={<Settings profile={auth.profile} updateProfile={auth.updateProfile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
