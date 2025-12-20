import { NextIntlClientProvider } from "next-intl";
import { TRPCReactProvider } from "@/utils/trpc/client";
import { ThemeProvider } from "next-themes";

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
        </ThemeProvider>
      </TRPCReactProvider>
    </NextIntlClientProvider>
  );
}
