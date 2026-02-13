"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, ArrowRight, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const slideOut = {
  exit: {
    opacity: 0,
    x: -40,
    filter: "blur(4px)",
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
  },
};

const slideIn = {
  initial: { opacity: 0, x: 40, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

function MfaForm({
  onVerify,
  onBack,
  onUseBackupCode,
  isLoading,
}: {
  onVerify: (code: string) => void;
  onBack: () => void;
  onUseBackupCode: () => void;
  isLoading: boolean;
}) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timeRemaining, setTimeRemaining] = useState(OTP_EXPIRY_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit when all digits filled
  useEffect(() => {
    const code = otp.join("");
    if (code.length === OTP_LENGTH && otp.every((d) => d !== "")) {
      onVerify(code);
    }
  }, [otp, onVerify]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, OTP_LENGTH - index).split("");
      chars.forEach((char, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      const newOtp = [...otp];
      pasted.split("").forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <motion.div
      {...slideIn}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <ShieldCheck className="h-7 w-7" />
        </motion.div>
        <h2 className="text-xl font-bold mt-4">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15 + index * 0.05,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
          >
            <Input
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`h-14 w-12 text-center text-xl font-bold bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 transition-all ${
                digit ? "bg-primary/5 ring-1 ring-primary/20" : ""
              }`}
              disabled={isLoading || timeRemaining === 0}
              aria-label={`Digit ${index + 1}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        {timeRemaining > 0 ? (
          <p className="text-xs text-muted-foreground">
            Code expires in{" "}
            <span className={`font-mono font-semibold ${timeRemaining <= 30 ? "text-destructive" : "text-foreground"}`}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </p>
        ) : (
          <p className="text-xs text-destructive font-medium">
            Code expired. Please request a new one.
          </p>
        )}
      </motion.div>

      {/* Verify button */}
      <Button
        className="w-full h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        disabled={isLoading || otp.some((d) => d === "") || timeRemaining === 0}
        onClick={() => onVerify(otp.join(""))}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Verifying..." : "Verify Code"}
      </Button>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to login
        </button>
        <button
          type="button"
          onClick={onUseBackupCode}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <KeyRound className="h-3 w-3" />
          Use backup code
        </button>
      </div>
    </motion.div>
  );
}

function BackupCodeForm({
  onVerify,
  onBack,
  isLoading,
}: {
  onVerify: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [backupCode, setBackupCode] = useState("");

  return (
    <motion.div
      {...slideIn}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-lg shadow-amber-500/10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <KeyRound className="h-7 w-7" />
        </motion.div>
        <h2 className="text-xl font-bold mt-4">Use Backup Code</h2>
        <p className="text-sm text-muted-foreground">
          Enter one of your backup recovery codes
        </p>
      </div>

      <div className="space-y-3">
        <Input
          type="text"
          placeholder="xxxx-xxxx-xxxx"
          value={backupCode}
          onChange={(e) => setBackupCode(e.target.value)}
          className="h-11 bg-muted/50 border-0 text-center font-mono text-lg tracking-wider focus-visible:ring-2 focus-visible:ring-primary/20"
          disabled={isLoading}
        />
        <Button
          className="w-full h-11 font-semibold"
          disabled={isLoading || !backupCode.trim()}
          onClick={() => onVerify(backupCode)}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Verifying..." : "Verify Backup Code"}
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to OTP verification
        </button>
      </div>
    </motion.div>
  );
}

type MfaStep = "login" | "mfa" | "backup";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaStep, setMfaStep] = useState<MfaStep>("login");
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", values);

      if (data.mfa_required) {
        setMfaToken(data.mfa_token || data.access_token);
        setMfaStep("mfa");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data.user);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError.response?.data?.error?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleMfaVerify = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/mfa/verify", {
        mfa_token: mfaToken,
        code,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data.user);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError.response?.data?.error?.message || "Invalid verification code. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [mfaToken, router, setUser]);

  const handleBackupVerify = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/mfa/backup", {
        mfa_token: mfaToken,
        backup_code: code,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      setUser(data.user);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message =
        axiosError.response?.data?.error?.message || "Invalid backup code. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [mfaToken, router, setUser]);

  return (
    <AnimatePresence mode="wait">
      {mfaStep === "login" && (
        <motion.div
          key="login"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={slideOut.exit}
        >
          <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
            <CardHeader className="text-center pb-2">
              <motion.div variants={itemVariants} className="mx-auto mb-4">
                <motion.div
                  className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                >
                  <Building2 className="h-7 w-7" />
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-glow" />
                </motion.div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription className="text-sm">
                  Sign in to your practice management workspace
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent className="pt-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@yourfirm.com"
                              autoComplete="email"
                              className="h-11 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="h-11 bg-muted/50 border-0 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            <motion.div variants={itemVariants}>
              <CardFooter className="justify-center border-t bg-muted/30 py-4">
                <p className="text-sm text-muted-foreground">
                  New to CPA Platform?{" "}
                  <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Create an account
                  </Link>
                </p>
              </CardFooter>
            </motion.div>
          </Card>
        </motion.div>
      )}

      {mfaStep === "mfa" && (
        <motion.div key="mfa">
          <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
            <CardContent className="pt-8 pb-8">
              <MfaForm
                onVerify={handleMfaVerify}
                onBack={() => {
                  setMfaStep("login");
                  setMfaToken(null);
                }}
                onUseBackupCode={() => setMfaStep("backup")}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {mfaStep === "backup" && (
        <motion.div key="backup">
          <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 dark:shadow-black/20">
            <CardContent className="pt-8 pb-8">
              <BackupCodeForm
                onVerify={handleBackupVerify}
                onBack={() => setMfaStep("mfa")}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
