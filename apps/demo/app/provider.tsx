import { NextIntlClientProvider } from "next-intl";
import { TRPCReactProvider } from "@/utils/trpc/client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export default function RootProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider>
      <TRPCReactProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          value={{ light: "light", dark: "dark" }}
        >
          {children}

          <Toaster
            position="top-center"
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  "flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-background text-sm shadow-lg",
                title: "font-medium",
                icon: "shrink-0",
                success: "[&_svg]:text-emerald-500",
                error: "[&_svg]:text-destructive",
              },
            }}
          />
        </ThemeProvider>
      </TRPCReactProvider>
    </NextIntlClientProvider>
  );
}
