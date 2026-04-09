import { useNavigate } from "react-router-dom";

const wrapStyle = {
  minHeight: "100vh", background: "#F7F3EE", color: "#2D2520",
  fontFamily: "'DM Sans', sans-serif",
};

const containerStyle = {
  maxWidth: 720, margin: "0 auto", padding: "60px 32px 100px",
};

const navStyle = {
  maxWidth: 1120, margin: "0 auto", padding: "20px 32px",
  display: "flex", alignItems: "center", justifyContent: "space-between",
};

const h1Style = {
  fontFamily: "'DM Serif Display', serif", fontSize: 40, fontWeight: 400,
  color: "#2D2520", marginBottom: 12, letterSpacing: "-0.5px",
};

const h2Style = {
  fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400,
  color: "#2D2520", marginTop: 32, marginBottom: 10,
};

const pStyle = {
  fontSize: 14, color: "#5C534A", lineHeight: 1.7, marginBottom: 12,
};

function Layout({ children }) {
  const navigate = useNavigate();
  return (
    <div style={wrapStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <img src="/ella-parrot.png" alt="Ella" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400 }}>Ella</span>
        </div>
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", color: "#6B5E54", fontSize: 14,
          fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
        }}>&larr; Back to home</button>
      </nav>
      <div style={containerStyle}>{children}</div>
    </div>
  );
}

export function Terms() {
  return (
    <Layout>
      <h1 style={h1Style}>Terms of Service</h1>
      <p style={{ fontSize: 12, color: "#B5A698", marginBottom: 24 }}>Last updated: April 9, 2026</p>

      <p style={pStyle}>
        Welcome to Ella. By using our service at getella.io, you agree to these terms.
      </p>

      <h2 style={h2Style}>1. What Ella does</h2>
      <p style={pStyle}>
        Ella helps you create LinkedIn posts by researching topics, generating drafts, and scoring content.
        It is a writing assistant, not a publishing tool — you are always responsible for reviewing and posting your own content.
      </p>

      <h2 style={h2Style}>2. Your account</h2>
      <p style={pStyle}>
        You need an account to use Ella. Keep your password secure. You're responsible for activity under your account.
        You must be 18 or older to use Ella.
      </p>

      <h2 style={h2Style}>3. Usage limits</h2>
      <p style={pStyle}>
        Free tier includes 3 post generations per month. Abuse of the service — including attempts to bypass rate limits,
        scrape content, or use the service for spam or harassment — will result in account termination.
      </p>

      <h2 style={h2Style}>4. Your content</h2>
      <p style={pStyle}>
        You retain ownership of everything you create with Ella. The posts you generate, the drafts you edit, the insights you share —
        they're yours. We don't claim any rights to your output.
      </p>

      <h2 style={h2Style}>5. Ella's content</h2>
      <p style={pStyle}>
        Ella uses third-party AI models (Anthropic Claude) to generate drafts. We don't guarantee the accuracy of
        AI-generated content. Always verify facts before posting. Ella includes a built-in fact validation tool, but it's not a substitute for your own judgment.
      </p>

      <h2 style={h2Style}>6. Acceptable use</h2>
      <p style={pStyle}>
        Don't use Ella to create content that is illegal, harassing, defamatory, deceptive, or that impersonates another person.
        Don't reverse-engineer the service or attempt to access other users' data.
      </p>

      <h2 style={h2Style}>7. Termination</h2>
      <p style={pStyle}>
        You can delete your account at any time. We reserve the right to suspend or terminate accounts that violate these terms.
      </p>

      <h2 style={h2Style}>8. Disclaimer</h2>
      <p style={pStyle}>
        Ella is provided "as is" without warranties. We're not liable for any damages arising from your use of the service,
        including lost content, missed opportunities, or posts that don't perform as expected.
      </p>

      <h2 style={h2Style}>9. Changes</h2>
      <p style={pStyle}>
        We may update these terms as Ella evolves. We'll notify users of material changes via email.
      </p>

      <h2 style={h2Style}>10. Contact</h2>
      <p style={pStyle}>
        Questions about these terms? Email us at hello@getella.io
      </p>
    </Layout>
  );
}

export function Privacy() {
  return (
    <Layout>
      <h1 style={h1Style}>Privacy Policy</h1>
      <p style={{ fontSize: 12, color: "#B5A698", marginBottom: 24 }}>Last updated: April 9, 2026</p>

      <p style={pStyle}>
        Your privacy matters. Here's what we collect, why, and how we protect it.
      </p>

      <h2 style={h2Style}>What we collect</h2>
      <p style={pStyle}>
        <strong>Account data:</strong> Email address and password (hashed) for authentication.
      </p>
      <p style={pStyle}>
        <strong>Profile data:</strong> Your industry, occupation, LinkedIn background, voice profile, and any other information you choose to provide in Settings.
        This data powers personalized drafts.
      </p>
      <p style={pStyle}>
        <strong>Usage data:</strong> Post generations, drafts you create, topics you research. This is stored in your account for your own use.
      </p>

      <h2 style={h2Style}>How we use it</h2>
      <p style={pStyle}>
        We use your data to provide the Ella service — researching topics, generating drafts in your voice, and tracking your usage against rate limits.
        We do not sell your data. We do not share it with advertisers.
      </p>

      <h2 style={h2Style}>Third parties we work with</h2>
      <p style={pStyle}>
        <strong>Anthropic (Claude):</strong> Your prompts are sent to Anthropic to generate drafts. Anthropic's privacy policy applies to their processing.
      </p>
      <p style={pStyle}>
        <strong>Supabase:</strong> Hosts our database and authentication. Your account and content are stored on Supabase's infrastructure.
      </p>
      <p style={pStyle}>
        <strong>Vercel:</strong> Hosts our web application.
      </p>

      <h2 style={h2Style}>Data security</h2>
      <p style={pStyle}>
        Your data is protected by row-level security in Supabase — only you can access your own profile, drafts, and usage history.
        Passwords are hashed, never stored in plain text. All connections use HTTPS.
      </p>

      <h2 style={h2Style}>Your rights</h2>
      <p style={pStyle}>
        You can access, export, or delete your data at any time from Settings. To delete your entire account, email us at hello@getella.io and we'll handle it within 7 days.
      </p>

      <h2 style={h2Style}>Cookies</h2>
      <p style={pStyle}>
        Ella uses essential cookies for authentication and preferences. We may add privacy-focused analytics (Plausible or similar) that don't track individuals across sites.
      </p>

      <h2 style={h2Style}>Children</h2>
      <p style={pStyle}>
        Ella is not intended for users under 18. We do not knowingly collect data from minors.
      </p>

      <h2 style={h2Style}>Changes</h2>
      <p style={pStyle}>
        We'll notify users of material changes to this policy via email.
      </p>

      <h2 style={h2Style}>Contact</h2>
      <p style={pStyle}>
        Privacy questions? Email hello@getella.io
      </p>
    </Layout>
  );
}
