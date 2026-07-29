import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthUrl, login, register } from "../api/auth";
import { FullLogo } from "../components/Logo";
import { loginSchema, signupSchema } from "../schemas/auth";
import logger from "../utils/logger";

function FormSubmitOptions({ type }: { type: "login" | "signup" }) {
  const handleGoogleLogin = () => {
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="flex flex-col items-center w-full mt-6">
      <button
        type="submit"
        className="border border-brand-border-subtle w-full rounded-xl py-2 text-sm text-brand-text cursor-pointer transition-colors duration-200 hover:border-brand-border hover:bg-brand-border-subtle"
      >
        {type === "login" ? "Log in" : "Create account"}
      </button>
      <div className="flex items-center gap-3 w-full my-2">
        <div className="flex-1 h-px bg-brand-text-secondary" />
        <span className="text-xs text-brand-text-secondary">or</span>
        <div className="flex-1 h-px bg-brand-text-secondary" />
      </div>
      <button
        onClick={handleGoogleLogin}
        type="button"
        className="cursor-pointer flex items-center justify-center gap-2 border border-brand-border-subtle w-full rounded-xl py-2 text-sm text-brand-text hover:border-brand-border hover:bg-brand-border-subtle transition-colors duration-200"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loginError, setLoginError] = useState("");

  const validateEmail = (value: string) => {
    const result = loginSchema.shape.email.safeParse(value);
    if (!result.success) {
      setEmailError(result.error.issues[0].message);
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (value: string) => {
    const result = loginSchema.shape.password.safeParse(value);
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setLoginError("");

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      if (errors.email) setEmailError(errors.email[0]);
      if (errors.password) setPasswordError(errors.password[0]);
      return;
    }

    try {
      const res = await login(email, password);
      logger.debug("Res:", { res });
      navigate("/Dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        const apiError = error as { error: string };
        setLoginError(apiError.error ?? "Something went wrong");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h3 className="text-brand-text font-semibold text-lg">Welcome back</h3>
        <p className="text-brand-text-secondary text-left text-sm">
          Log in to your Finapse account
        </p>
      </div>
      <div className="mt-4">
        <div>
          <span className="text-brand-text-secondary text-xs">Email</span>
          <input
            className="mt-1 w-full bg-brand-bg border border-brand-border-subtle rounded-md py-2 px-2 text-brand-text focus:outline-none"
            autoComplete="email"
            type="email"
            onBlur={() => validateEmail(email)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=""
          />
          {emailError && (
            <p className="text-xs text-brand-error mt-1">{emailError}</p>
          )}
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-brand-text-secondary text-xs">Password</span>
            <button
              type="button"
              className="text-brand-text-secondary text-xs cursor-pointer"
            >
              Forgot
            </button>
          </div>
          <input
            className="mt-1 w-full bg-brand-bg border border-brand-border-subtle rounded-md py-2 px-2 text-brand-text focus:outline-none"
            autoComplete="current-password"
            onBlur={() => validatePassword(password)}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
          />
          {passwordError && (
            <p className="text-xs text-brand-error mt-1">{passwordError}</p>
          )}
        </div>
      </div>
      {loginError && (
        <p className="flex justify-center text-xs text-brand-error mt-2">
          {loginError}
        </p>
      )}
      <FormSubmitOptions type="login" />
      <div className="flex items-center w-full justify-center mt-6">
        <span className="text-xs text-brand-text-secondary">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-brand-green cursor-pointer"
          >
            Sign up free
          </button>
        </span>
      </div>
    </form>
  );
}

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signupError, setSignupError] = useState("");

  const validateEmail = (value: string) => {
    const result = signupSchema.shape.email.safeParse(value);
    if (!result.success) {
      setEmailError(result.error.issues[0].message);
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (value: string) => {
    const result = signupSchema.shape.password.safeParse(value);
    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
    } else {
      setPasswordError("");
    }
  };

  const validateFullName = (value: string) => {
    const result = signupSchema.shape.fullName.safeParse(value);
    if (!result.success) {
      setFullNameError(result.error.issues[0].message);
    } else {
      setFullNameError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setSignupError("");

    const result = signupSchema.safeParse({ email, password, fullName });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      if (errors.email) setEmailError(errors.email[0]);
      if (errors.password) setPasswordError(errors.password[0]);
      if (errors.fullName) setFullNameError(errors.fullName[0]);
      return;
    }

    try {
      const res = await register(email, password, fullName);
      logger.debug("Res:", { res });
      navigate("/Dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setSignupError(error.message);
      } else {
        const apiError = error as { error: string };
        setSignupError(apiError.error ?? "Something went wrong");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h3 className="text-brand-text font-semibold text-lg">
          Create your account
        </h3>
        <p className="text-brand-text-secondary text-left text-sm">
          Free to start — no credit card needed
        </p>
      </div>
      <div className="mt-4">
        <div>
          <span className="text-brand-text-secondary text-xs">Full Name</span>
          <input
            className="mt-1 w-full bg-brand-bg border border-brand-border-subtle rounded-md py-2 px-2 text-brand-text focus:outline-none"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => validateFullName(fullName)}
            autoComplete="name"
            type="text"
            placeholder=""
          />
          {fullNameError && (
            <p className="text-xs text-brand-error mt-1">{fullNameError}</p>
          )}
        </div>
        <div>
          <span className="text-brand-text-secondary text-xs">Email</span>
          <input
            className="mt-1 w-full bg-brand-bg border border-brand-border-subtle rounded-md py-2 px-2 text-brand-text focus:outline-none"
            type="email"
            placeholder=""
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateEmail(email)}
          />
          {emailError && (
            <p className="text-xs text-brand-error mt-1">{emailError}</p>
          )}
        </div>
        <div className="mt-6">
          <span className="text-brand-text-secondary text-xs">Password</span>
          <input
            className="mt-1 w-full bg-brand-bg border border-brand-border-subtle rounded-md py-2 px-2 text-brand-text focus:outline-none"
            type="password"
            placeholder=""
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => validatePassword(password)}
          />
          {passwordError && (
            <p className="text-xs text-brand-error mt-1">{passwordError}</p>
          )}
        </div>
      </div>
      {signupError && (
        <p className="flex justify-center text-xs text-brand-error mt-2">
          {signupError}
        </p>
      )}
      <FormSubmitOptions type="signup" />
      <div className="flex items-center w-full justify-center mt-6">
        <span className="text-xs text-brand-text-secondary">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-brand-green cursor-pointer"
          >
            Log in
          </button>
        </span>
      </div>
    </form>
  );
}

export function AuthModal({
  open,
  onClose,
  defaultTab = "login",
}: {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset the tab to defaultTab each time the modal transitions to open.
  // Done during render (not in an effect) to avoid an extra render pass.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setActiveTab(defaultTab);
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-100 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl relative py-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-6 w-8 h-8 bg-brand-surface-input rounded-xl text-brand-text-secondary border border-brand-border-subtle cursor-pointer transition-all duration-200 hover:text-brand-text hover:border-brand-text"
        >
          ✕
        </button>
        <div className="flex flex-col items-center">
          <div className="self-start pt-6 pl-2">
            <FullLogo size="md" />
          </div>
          <div className="w-80 mt-8 flex bg-brand-bg border border-brand-border-subtle p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium text-brand-text cursor-pointer ${activeTab === "login" ? "bg-brand-tab-active" : ""}`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 rounded-lg text-sm text-brand-text-hint hover:text-brand-text cursor-pointer ${activeTab === "signup" ? "bg-brand-tab-active" : ""}`}
            >
              Sign up
            </button>
          </div>
          <div className="mt-4 w-80">
            {activeTab === "login" ? (
              <LoginForm onSwitch={() => setActiveTab("signup")} />
            ) : (
              <SignupForm onSwitch={() => setActiveTab("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
