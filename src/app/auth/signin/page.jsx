// /app/auth/signin/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // Correct import!
import { SignInPage } from "@toolpad/core";
import { Box } from "@mui/material";

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleSignInAttempt = async (provider, formData) => {
    setError("");

    if (provider.id === "credentials") {
      const email = formData.get("email");
      const password = formData.get("password");

      const result = await signIn("credentials", {
        redirect: true,
        email: email,
        password: password,
      });

      if (result.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        return { error: "Invalid credentials" };
      } else if (result.ok) {
        router.replace("/dashboard");
      }
    }
  };

  const clientSideProviders = [{ id: "credentials", name: "Credentials" }];

  return (
<Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundImage: `url(/background.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <SignInPage
        signIn={handleSignInAttempt}
        providers={clientSideProviders}
        slotProps={{
          submitButton: {
            color: "primary",
            variant: "contained",
          },
        }}
      />
      {error && (
        <div style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>
          {error}
        </div>
      )}
    </Box>
  );
}
