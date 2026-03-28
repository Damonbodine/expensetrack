"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [redirectUrl, setRedirectUrl] = useState("/my-dashboard");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/?\??/, "");
    const params = new URLSearchParams(hash);
    const redirect = params.get("redirect");
    if (redirect && redirect.startsWith("/")) {
      setRedirectUrl(redirect);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ExpenseTrack</h1>
          <p className="mt-2 text-sm text-muted-foreground">Nonprofit expense management made simple</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md border border-border",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}
