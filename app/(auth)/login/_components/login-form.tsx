"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const router = useRouter();

  const [email, setEmail] = useState("");
  async function signInWithGithub() {
    startTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with Github, you'll be redirected...");
          },
          onError: () => {
            toast.error("Internal Server Error");
          },
        },
      });
    });
  }

  async function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email Sent");
            router.push(`/verify-request?email=${email}`);
          },
          onError: () => {
            toast.error("Error sending email");
          },
        },
      });
    });
  }
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Welcome back!</CardTitle>
        <CardDescription>
          Login with your github or Email Account
        </CardDescription>
        <CardContent className="flex flex-col space-y-4 p-0">
          <Button
            onClick={signInWithGithub}
            className="w-full"
            variant={"secondary"}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin size-4" />
                Loading...
              </>
            ) : (
              <>
                {" "}
                <Image
                  src="/github.png"
                  width={80}
                  height={80}
                  alt=""
                  className="size-6"
                />
                Sign in with Github
              </>
            )}
          </Button>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-card text-muted-foreground px-2">
              Or continue with
            </span>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="test@example.com"
              />
            </div>
            <Button disabled={emailPending} onClick={signInWithEmail}>
              {emailPending ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  Loading...
                </>
              ) : (
                <>
                  <Send />
                  Continue with Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
