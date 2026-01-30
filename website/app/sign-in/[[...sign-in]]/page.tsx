import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-accent">[</span>
            Leedo
            <span className="text-accent">]</span>
          </h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-gray-800 border border-gray-700 rounded-xl shadow-xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton:
                "bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
              socialButtonsBlockButtonText: "text-white",
              dividerLine: "bg-gray-600",
              dividerText: "text-gray-400",
              formFieldLabel: "text-gray-300",
              formFieldInput:
                "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-accent",
              formButtonPrimary:
                "bg-accent hover:bg-accent-light text-background font-semibold",
              footerActionLink: "text-accent hover:text-accent-light",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-accent hover:text-accent-light",
              formFieldInputShowPasswordButton: "text-gray-400",
              otpCodeFieldInput: "bg-gray-700 border-gray-600 text-white",
            },
            variables: {
              colorPrimary: "#c8ff00",
              colorBackground: "#1f2937",
              colorText: "#f3f4f6",
              colorTextSecondary: "#9ca3af",
              colorInputBackground: "#374151",
              colorInputText: "#f3f4f6",
            },
          }}
        />

        <p className="text-center text-gray-500 text-sm mt-6">
          Protected area. Authorized users only.
        </p>
      </div>
    </div>
  );
}
