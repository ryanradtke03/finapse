import { useEffect, useState } from "react";
//import { useNavigate } from "react-router-dom";
//import { googleAuthUrl, login, register } from "../api/auth";
import { FullLogo } from "../components/Logo";
//import { loginSchema, signupSchema } from "../schemas/auth";
//import logger from "../utils/logger";

function FormSubmitOptions({type}: {type: "login" | "signup"}){
  return(
    <div className="flex flex-col items-center w-full mt-6">
      {/** Login */}
      <button type="submit" className="border border-brand-border-subtle w-full rounded-xl py-2 text-sm text-brand-text cursor-pointer transition-colors duration-200 hover:border-brand-border hover:bg-brand-border-subtle">
        {type === "login" ? "Log in" : "Create account"}
      </button>
      {/** OR */}
      <div className="flex items-center gap-3 w-full my-2">
        <div className="flex-1 h-px bg-brand-text-secondary"/>
        <span className="text-xs text-brand-text-secondary">or</span>
        <div className="flex-1 h-px bg-brand-text-secondary"/>
      </div>
      {/** Google */}
      <button className=" cursor-pointer flex items-center justify-center gap-2 border border-brand-border-subtle w-full rounded-xl py-2 text-sm text-brand-text hover:border-brand-border hover:bg-brand-border-subtle transition-colors duration-200">
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
    </div>
  );
}

function LoginForm({onSwitch}: {onSwitch: () => void}){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {

    console.log(password, username)

  }
  return(
    <div>
      <div>
        {/** Title */}
        <h3 className="text-brand-text font-semibold text-lg">
          Welcome back
        </h3>
        <p className="text-brand-text-secondary text-left text-sm">
          Log in to your Finapse account
        </p>
      </div>
      {/** Fields */}
      <div className="mt-4">
        {/** Email Field */}
        <div>
          <span className="text-brand-text-secondary text-xs">Email</span>
          <input
          className="
          mt-1
          w-full
          bg-brand-bg
          border border-brand-border-subtle
          rounded-md
          py-2
          px-2
          text-brand-text
          focus:outline-none
          "
          type="email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder=""
          />
        </div>
        {/** Password Field */}
        <div className="mt-6">
          <div className=" flex items-center justify-between">
            <span className="text-brand-text-secondary text-xs">Password</span>
            <button className="text-brand-text-secondary text-xs cursor-pointer">Forgot</button>
          </div>
          <input
            className="
            mt-1
            w-full
            bg-brand-bg
            border border-brand-border-subtle
            rounded-md
            py-2
            px-2
            text-brand-text
            focus:outline-none
            "
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
          />
        </div>
      </div>
      {/** Form Submit Options */}
      <FormSubmitOptions type="login"/>
      {/** Footer */}
      <div className="flex items-center w-full justify-center mt-6">
        <span className="text-xs text-brand-text-secondary">
          Don't have an account? <button onClick={onSwitch} className="text-brand-green cursor-pointer">Sign up free</button>
        </span>
      </div>
    </div>
  );
}

function SignupForm({onSwitch}: {onSwitch: () => void}){
  return(
    <div>
      {/** Title */}
      <div>
        <h3 className="text-brand-text font-semibold text-lg">
          Create your account
        </h3>
        <p className="text-brand-text-secondary text-left text-sm">
          Free to start — no credit card needed
        </p>
      </div>
      {/** Fields */}
      <div className="mt-4">
        {/** Name Field */}
        <div>
          <span className="text-brand-text-secondary text-xs">Full Name</span>
          <input
          className="
          mt-1
          w-full
          bg-brand-bg
          border border-brand-border-subtle
          rounded-md
          py-2
          px-2
          text-brand-text
          focus:outline-none
          "
          type="text"
          placeholder=""
          />
        </div>
        {/** Email Field */}
        <div>
          <span className="text-brand-text-secondary text-xs">Email</span>
          <input
          className="
          mt-1
          w-full
          bg-brand-bg
          border border-brand-border-subtle
          rounded-md
          py-2
          px-2
          text-brand-text
          focus:outline-none
          "
          type="email"
          placeholder=""
          />
        </div>
        {/** Password Field */}
        <div className="mt-6">
          <div className=" flex items-center justify-between">
            <span className="text-brand-text-secondary text-xs">Password</span>
          </div>
          <input
            className="
            mt-1
            w-full
            bg-brand-bg
            border border-brand-border-subtle
            rounded-md
            py-2
            px-2
            text-brand-text
            focus:outline-none
            "
            type="password"
            placeholder=""
          />
        </div>
      </div>
      {/** Form Submit Options */}
      <FormSubmitOptions type="signup"/>
      {/** Footer */}
      <div className="flex items-center w-full justify-center mt-6">
        <span className="text-xs text-brand-text-secondary">
          Already have an account? <button onClick={onSwitch} className="text-brand-green cursor-pointer">Log in</button>
        </span>
      </div>
    </div>
  );
}

export function AuthModal({open, onClose, defaultTab = "login"}: {open: boolean, onClose: () => void, defaultTab?: "login" | "signup"}){
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab)

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab)
    }
  }, [open, defaultTab])

  if(!open) return null;

  return(
    <div  onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/** Modal Wrapper v Modal Background ^ */}
      <div  
      onClick={(e) => e.stopPropagation()}
        className={`
          w-100
          bg-brand-surface
          border border-brand-border
          rounded-2xl
          shadow-2xl  
          relative
          ${
            activeTab === "login"
            ? "h-145"
            : "h-160"
          }
        `}>
          {/** Close Button */}
          <button onClick={onClose} className={`
            absolute top-4 right-6 w-8 h-8 bg-brand-surface-input rounded-xl text-brand-text-secondary
            border border-brand-border-subtle
            cursor-pointer
            transition-all duration-200
            hover:text-brand-text
            hover:border-brand-text
            `}>
            ✕ 
          </button>
          {/** Main Content */}
          <div className="flex flex-col items-center ">
            {/** Logo */}
            <div className="self-start pt-6 pl-2">
              <FullLogo size="md"/>
            </div>
            {/** Form Type */}
            <div className="w-80 mt-8 flex bg-brand-bg border border-brand-border-subtle p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab("login")}
                className={`
                flex-1 py-2 rounded-lg text-sm font-medium text-color-brand-text cursor-pointer
                ${
                  activeTab === "login"
                  ? "bg-brand-tab-active"
                  : ""
                }
                `}>
                Log in
              </button>
              <button 
                onClick={() => setActiveTab("signup")}
                className={`
                flex-1 py-2 rounded-lg text-sm text--color-brand-text-hint hover:text-color-brand-text cursor-pointer
                ${
                  activeTab === "signup"
                  ? "bg-brand-tab-active"
                  : ""
                }
                `}>
                Sign up
              </button>
            </div>
            {/** Form */}
            <div className="mt-4 w-80">
              {activeTab === "login" ? <LoginForm onSwitch={() => setActiveTab("signup")}/> : <SignupForm onSwitch={() => setActiveTab("login")}/>}
            </div>
          </div>
      </div>
    </div>
  )
}



// function LoginForm() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [emailError, setEmailError] = useState("");
//   const [passwordError, setPasswordError] = useState("");
//   const [loginError, setLoginError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Clear errors
//     setEmailError("");
//     setPasswordError("");
//     setLoginError("");

//     // Zod Validation
//     const result = loginSchema.safeParse({email, password});

//     // Handle Form Error 
//     if(!result.success){
//       const errors = result.error.flatten().fieldErrors;
//       if (errors.email) setEmailError(errors.email[0]);
//       if (errors.password) setPasswordError(errors.password[0]);

//       logger.warn("Invalid Credentials: ", {
//         ...(emailError && {email : emailError}),
//         ...(passwordError && {password: passwordError}),
//       })

//       return;
//     }

//     // Make call to endpoint 
//     logger.debug("Make call to login endpoint");
//     try{
//       const res = await login(email, password);
//       logger.debug("Res:", {res: await res.json()});

//       navigate("/Dashboard");
      

//     }catch(error: unknown){
//       if(error instanceof Error){
//         logger.error("Login failed:", {error: error.message});
//         setLoginError(error.message);
//       } else{
//         const apiError = error as {error: string};
//         logger.error("Login failed:", {error: apiError.error})
//         setLoginError(apiError.error ?? "Something went wrong");
//       }
//     }


//   }

//   return (
//     <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 w-full">
//       {/* Email*/}
//       <div className="w-full">
//       {loginError && 
//           <p className="text-sm mt-1 text-brand-error">
//             {loginError}
//           </p>
//           }
//         <label className="block text-sm font-medium mb-1 text-brand-hint">
//           Email
//         </label>
//         <input
//           className="
//                 w-full
//                 bg-brand-input
//                 border border-brand-border
//                 rounded-lg
//                 text-base
//                 px-4 py-2
//                 placeholder:text-brand-hint
//                 text-brand-text
//                 focus:outline-none
//                 focus:border-brand-green/50
//                 "
//           type="email"
//           placeholder="you@email.com"
//           autoComplete="username"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//       </div>
//       {/* Password */}
//       <div className="w-full">
//         <label className="block text-sm font-medium mb-1 text-brand-hint">
//           Password
//         </label>
//         <input
//           className="
//                 w-full
//                 bg-brand-input
//                 border border-brand-border
//                 rounded-lg
//                 text-base
//                 px-4 py-2
//                 placeholder:text-brand-hint
//                 text-brand-text
//                 focus:outline-none
//                 focus:border-brand-green/50
//               "
//           type="password"
//           placeholder="password"
//           autoComplete="current-password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//            {passwordError && 
//           <p className="text-sm mt-1 text-brand-error">
//             {passwordError}
//           </p>
//           }
//         <div className="w-full flex justify-end">
     
//           <button className="block text-sm font-medium mb-1 text-brand-hint cursor-pointer">
//             Forgot Password?
//           </button>
          
//         </div>
//       </div>
//       {/* Submit Button */}
//       <div className="flex justify-center py-2">
//         <button
//           className="border-r 
//               border-brand-border 
//                 rounded-2xl
//               bg-brand-bg
//                 shadow-md
//                 px-4 py-1
//                 w-60
//                 cursor-pointer
//               hover:bg-brand-green        
//               hover:text-brand-text       
//               hover:border-white/30               
//                 "
//           type="submit"
//         >
//           Submit
//         </button>
//       </div>
//     </form>
//   );
// }

// function SignupForm() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const [emailError, setEmailError] = useState("");
//   const [passwordError, setPasswordError] = useState("");
//   const [confirmPasswordError, setConfirmPasswordError] = useState("");
//   const [registerError, setRegisterError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {

//     e.preventDefault();

//     // Clear errors
//     setEmailError("");
//     setPasswordError("");
//     setConfirmPasswordError("");
//     setRegisterError("");

//     // Zod Validation
//     const result = signupSchema.safeParse({email, password, confirmPassword});

//     // Handle Form Error 
//     if(!result.success){
//       const errors = result.error.flatten().fieldErrors;
//       if (errors.email) setEmailError(errors.email[0]);
//       if (errors.password) setPasswordError(errors.password[0]);
//       if (errors.confirmPassword) setConfirmPasswordError(errors.confirmPassword[0])

//       logger.warn("Invalid Credentials: ", {
//         ...(emailError && {email : emailError}),
//         ...(passwordError && {password: passwordError}),
//         ...(confirmPasswordError && {confirmPassword: confirmPassword}),
//       })

//       return;
//     }

//      // Make call to endpoint 
//      logger.debug("Make call to register endpoint");
//      try{
//        const res = await register(email, password);
//        logger.debug("Res:", {res: await res.json()});
 
//        navigate("/Dashboard");
       
 
//      }catch(error: unknown){
//        if(error instanceof Error){
//          logger.error("Register failed:", {error: error.message});
//          setRegisterError(error.message);
//        } else{
//          const apiError = error as {error: string};
//          logger.error("Register failed:", {error: apiError.error})
//          setRegisterError(apiError.error ?? "Something went wrong");
//        }
//      }

//   }

//   return (
//     <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 w-full">
//       {/* Email*/}
//       <div className="w-full">
//       {registerError && 
//           <p className="text-sm mt-1 text-brand-error">
//             {registerError}
//           </p>
//           }
//         <label className="block text-sm font-medium mb-1 text-brand-hint">
//           Email
//         </label>
//         <input
//           className="
//                 w-full
//                 bg-brand-input
//                 border border-brand-border
//                 rounded-lg
//                 text-base
//                 px-4 py-2
//                 placeholder:text-brand-hint
//                 text-brand-text
//                 focus:outline-none
//                 focus:border-brand-green/50
//                 "
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//       </div>
//       {/* Password */}
//       <div className="w-full">
//         <label className="block text-sm font-medium mb-1 text-brand-hint">
//           Password
//         </label>
//         <input
//           className="
//                 w-full
//                 bg-brand-input
//                 border border-brand-border
//                 rounded-lg
//                 text-base
//                 px-4 py-2
//                 placeholder:text-brand-hint
//                 text-brand-text
//                 focus:outline-none
//                 focus:border-brand-green/50
//               "
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//          {passwordError && 
//           <p className="text-sm mt-1 text-brand-error">
//             {passwordError}
//           </p>
//           }
//       </div>
//       {/* Confirm Password */}
//       <div className="w-full">
//         <label className="block text-sm font-medium mb-1 text-brand-hint">
//           Confirm Password
//         </label>
//         <input
//           className="
//                 w-full
//                 bg-brand-input
//                 border border-brand-border
//                 rounded-lg
//                 text-base
//                 px-4 py-2
//                 placeholder:text-brand-hint
//                 text-brand-text
//                 focus:outline-none
//                 focus:border-brand-green/50
//               "
//           type="password"
//           placeholder="Password"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//         />
//          {confirmPasswordError && 
//           <p className="text-sm mt-1 text-brand-error">
//             {confirmPasswordError}
//           </p>
//           }
//       </div>
//       {/* Submit Button */}
//       <div className="flex justify-center py-2">
//         <button
//           className="border-r
//               border-brand-border
//                 rounded-2xl
//               bg-brand-bg
//                 shadow-md
//                 px-4 py-1
//                 w-60
//                 cursor-pointer
//               hover:bg-brand-green
//               hover:text-brand-text
//               hover:border-white/30
//                 "
//           type="submit"
//         >
//           Submit
//         </button>
//       </div>
//     </form>
//   );
// }

// function LandingPageCard() {
//   const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
//   const [googleError, setGoogleError] = useState("");

//   const handleGoogleAuth = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     setGoogleError("");
  
//     try {
//       window.location.href = googleAuthUrl;
//     } catch (error: unknown) {
//       if (error instanceof Error) {
//         logger.error("Google Auth failed:", { error: error.message });
//         setGoogleError(error.message);
//       } else {
//         const gError = error as { error: string };
//         logger.error("Google Auth failed:", { error: gError.error });
//         setGoogleError(gError.error ?? "Something went wrong");
//       }
//     }
//   };

//   return (
//     <div
//       className="
//           w-100 h-130
//           bg-brand-surface
//           border border-brand-border
//           rounded-2xl
//           shadow-2xl
//           p-6
//           "
//     >
//       {/* Card Content */}
//       <div
//         className="
//         h-full
//         grid grid-rows-[auto_auto_1fr_auto]
//         px-6 py-2
//         "
//       >
//         {/* Header */}
//         <div>
//           <h2 className="text-2xl font-bold text-brand-text">
//             {activeTab === "login" ? "Welcome Back!" : "Create Account"}
//           </h2>
//           <p className="text-sm text-brand-hint">
//             {activeTab === "login"
//               ? "Please enter your credentials to log in."
//               : "Sign up to start planning your meals."}
//           </p>
//         </div>
//         {/* Toggle Buttons */}
//         <div className="grid grid-cols-2 gap-4 py-5">
//           <button
//             onClick={() => setActiveTab("login")}
//             className={`
//             rounded-2xl px-4 py-1 cursor-pointer
//             border border-brand-border
//             transition-all duration-200
//             ${
//               activeTab === "login"
//                 ? "bg-brand-green text-brand-bg border-brand-green"
//                 : "bg-brand-bg text-brand-muted border-brand-border hover:bg-brand-surface hover:text-brand-text hover:border-white/20"
//             }
//           `}
//           >
//             Log In
//           </button>
//           <button
//             onClick={() => setActiveTab("signup")}
//             className={`
//             rounded-2xl px-4 py-1 cursor-pointer
//             border border-brand-border
//             transition-all duration-200
//             ${
//               activeTab === "signup"
//                 ? "bg-brand-green text-brand-bg border-brand-green"
//                 : "bg-brand-bg text-brand-muted border-brand-border hover:bg-brand-surface hover:text-brand-text hover:border-white/20"
//             }
//           `}
//           >
//             Sign Up
//           </button>
//         </div>
//         {/* Form */}
//         {activeTab === "login" ? <LoginForm /> : <SignupForm />}
//         <div></div>
//         {/* Google Login */}
//         <div className="flex flex-col items-center">
//           <button onClick={handleGoogleAuth} className="block text-sm font-medium mb-1 text-brand-hint">
//             Login Via Google
//           </button>
//           {googleError && 
//           <p className="text-sm mt-1 text-brand-error">
//             {googleError}
//           </p>
//           }
//         </div>
//       </div>
//     </div>
//   );
// }
