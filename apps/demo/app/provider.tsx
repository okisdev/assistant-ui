import { NextIntlClientProvider } from "next-intl";
import { TRPCReactProvider } from "@/utils/trpc/client";

export default function RootProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </NextIntlClientProvider>
  );
}
