import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthUrl, login, register } from "../api/auth";
import { loginSchema, signupSchema } from "../schemas/auth";
import logger from "../utils/logger";

export function AuthModal({open, onClose}: {open: boolean, onClose: () => void}){
  if(!open) return null;

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <LandingPageCard/>
      <button onClick={onClose}>Close</button>
    </div>
  )
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear errors
    setEmailError("");
    setPasswordError("");
    setLoginError("");

    // Zod Validation
    const result = loginSchema.safeParse({email, password});

    // Handle Form Error 
    if(!result.success){
      const errors = result.error.flatten().fieldErrors;
      if (errors.email) setEmailError(errors.email[0]);
      if (errors.password) setPasswordError(errors.password[0]);

      logger.warn("Invalid Credentials: ", {
        ...(emailError && {email : emailError}),
        ...(passwordError && {password: passwordError}),
      })

      return;
    }

    // Make call to endpoint 
    logger.debug("Make call to login endpoint");
    try{
      const res = await login(email, password);
      logger.debug("Res:", {res: await res.json()});

      navigate("/Dashboard");
      

    }catch(error: unknown){
      if(error instanceof Error){
        logger.error("Login failed:", {error: error.message});
        setLoginError(error.message);
      } else{
        const apiError = error as {error: string};
        logger.error("Login failed:", {error: apiError.error})
        setLoginError(apiError.error ?? "Something went wrong");
      }
    }


  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 w-full">
      {/* Email*/}
      <div className="w-full">
      {loginError && 
          <p className="text-sm mt-1 text-brand-error">
            {loginError}
          </p>
          }
        <label className="block text-sm font-medium mb-1 text-brand-hint">
          Email
        </label>
        <input
          className="
                w-full
                bg-brand-input
                border border-brand-border
                rounded-lg
                text-base
                px-4 py-2
                placeholder:text-brand-hint
                text-brand-text
                focus:outline-none
                focus:border-brand-green/50
                "
          type="email"
          placeholder="you@email.com"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {/* Password */}
      <div className="w-full">
        <label className="block text-sm font-medium mb-1 text-brand-hint">
          Password
        </label>
        <input
          className="
                w-full
                bg-brand-input
                border border-brand-border
                rounded-lg
                text-base
                px-4 py-2
                placeholder:text-brand-hint
                text-brand-text
                focus:outline-none
                focus:border-brand-green/50
              "
          type="password"
          placeholder="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
           {passwordError && 
          <p className="text-sm mt-1 text-brand-error">
            {passwordError}
          </p>
          }
        <div className="w-full flex justify-end">
     
          <button className="block text-sm font-medium mb-1 text-brand-hint cursor-pointer">
            Forgot Password?
          </button>
          
        </div>
      </div>
      {/* Submit Button */}
      <div className="flex justify-center py-2">
        <button
          className="border-r 
              border-brand-border 
                rounded-2xl
              bg-brand-bg
                shadow-md
                px-4 py-1
                w-60
                cursor-pointer
              hover:bg-brand-green        
              hover:text-brand-text       
              hover:border-white/30               
                "
          type="submit"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    // Clear errors
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setRegisterError("");

    // Zod Validation
    const result = signupSchema.safeParse({email, password, confirmPassword});

    // Handle Form Error 
    if(!result.success){
      const errors = result.error.flatten().fieldErrors;
      if (errors.email) setEmailError(errors.email[0]);
      if (errors.password) setPasswordError(errors.password[0]);
      if (errors.confirmPassword) setConfirmPasswordError(errors.confirmPassword[0])

      logger.warn("Invalid Credentials: ", {
        ...(emailError && {email : emailError}),
        ...(passwordError && {password: passwordError}),
        ...(confirmPasswordError && {confirmPassword: confirmPassword}),
      })

      return;
    }

     // Make call to endpoint 
     logger.debug("Make call to register endpoint");
     try{
       const res = await register(email, password);
       logger.debug("Res:", {res: await res.json()});
 
       navigate("/Dashboard");
       
 
     }catch(error: unknown){
       if(error instanceof Error){
         logger.error("Register failed:", {error: error.message});
         setRegisterError(error.message);
       } else{
         const apiError = error as {error: string};
         logger.error("Register failed:", {error: apiError.error})
         setRegisterError(apiError.error ?? "Something went wrong");
       }
     }

  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 w-full">
      {/* Email*/}
      <div className="w-full">
      {registerError && 
          <p className="text-sm mt-1 text-brand-error">
            {registerError}
          </p>
          }
        <label className="block text-sm font-medium mb-1 text-brand-hint">
          Email
        </label>
        <input
          className="
                w-full
                bg-brand-input
                border border-brand-border
                rounded-lg
                text-base
                px-4 py-2
                placeholder:text-brand-hint
                text-brand-text
                focus:outline-none
                focus:border-brand-green/50
                "
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {/* Password */}
      <div className="w-full">
        <label className="block text-sm font-medium mb-1 text-brand-hint">
          Password
        </label>
        <input
          className="
                w-full
                bg-brand-input
                border border-brand-border
                rounded-lg
                text-base
                px-4 py-2
                placeholder:text-brand-hint
                text-brand-text
                focus:outline-none
                focus:border-brand-green/50
              "
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
         {passwordError && 
          <p className="text-sm mt-1 text-brand-error">
            {passwordError}
          </p>
          }
      </div>
      {/* Confirm Password */}
      <div className="w-full">
        <label className="block text-sm font-medium mb-1 text-brand-hint">
          Confirm Password
        </label>
        <input
          className="
                w-full
                bg-brand-input
                border border-brand-border
                rounded-lg
                text-base
                px-4 py-2
                placeholder:text-brand-hint
                text-brand-text
                focus:outline-none
                focus:border-brand-green/50
              "
          type="password"
          placeholder="Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
         {confirmPasswordError && 
          <p className="text-sm mt-1 text-brand-error">
            {confirmPasswordError}
          </p>
          }
      </div>
      {/* Submit Button */}
      <div className="flex justify-center py-2">
        <button
          className="border-r
              border-brand-border
                rounded-2xl
              bg-brand-bg
                shadow-md
                px-4 py-1
                w-60
                cursor-pointer
              hover:bg-brand-green
              hover:text-brand-text
              hover:border-white/30
                "
          type="submit"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

function LandingPageCard() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [googleError, setGoogleError] = useState("");

  const handleGoogleAuth = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setGoogleError("");
  
    try {
      window.location.href = googleAuthUrl;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("Google Auth failed:", { error: error.message });
        setGoogleError(error.message);
      } else {
        const gError = error as { error: string };
        logger.error("Google Auth failed:", { error: gError.error });
        setGoogleError(gError.error ?? "Something went wrong");
      }
    }
  };

  return (
    <div
      className="
          w-100 h-130
          bg-brand-surface
          border border-brand-border
          rounded-2xl
          shadow-2xl
          p-6
          "
    >
      {/* Card Content */}
      <div
        className="
        h-full
        grid grid-rows-[auto_auto_1fr_auto]
        px-6 py-2
        "
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-brand-text">
            {activeTab === "login" ? "Welcome Back!" : "Create Account"}
          </h2>
          <p className="text-sm text-brand-hint">
            {activeTab === "login"
              ? "Please enter your credentials to log in."
              : "Sign up to start planning your meals."}
          </p>
        </div>
        {/* Toggle Buttons */}
        <div className="grid grid-cols-2 gap-4 py-5">
          <button
            onClick={() => setActiveTab("login")}
            className={`
            rounded-2xl px-4 py-1 cursor-pointer
            border border-brand-border
            transition-all duration-200
            ${
              activeTab === "login"
                ? "bg-brand-green text-brand-bg border-brand-green"
                : "bg-brand-bg text-brand-muted border-brand-border hover:bg-brand-surface hover:text-brand-text hover:border-white/20"
            }
          `}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`
            rounded-2xl px-4 py-1 cursor-pointer
            border border-brand-border
            transition-all duration-200
            ${
              activeTab === "signup"
                ? "bg-brand-green text-brand-bg border-brand-green"
                : "bg-brand-bg text-brand-muted border-brand-border hover:bg-brand-surface hover:text-brand-text hover:border-white/20"
            }
          `}
          >
            Sign Up
          </button>
        </div>
        {/* Form */}
        {activeTab === "login" ? <LoginForm /> : <SignupForm />}
        <div></div>
        {/* Google Login */}
        <div className="flex flex-col items-center">
          <button onClick={handleGoogleAuth} className="block text-sm font-medium mb-1 text-brand-hint">
            Login Via Google
          </button>
          {googleError && 
          <p className="text-sm mt-1 text-brand-error">
            {googleError}
          </p>
          }
        </div>
      </div>
    </div>
  );
}
