"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import type { RouterOutputs } from "@/server";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const mcpServerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Must be a valid URL"),
  transportType: z.enum(["http", "sse"]),
});

type MCPServerFormValues = z.infer<typeof mcpServerSchema>;

type HeaderEntry = { key: string; value: string };

type MCPServerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server?: Pick<
    RouterOutputs["apps"]["mcp"]["list"][number],
    | "id"
    | "name"
    | "url"
    | "transportType"
    | "headers"
    | "oauthAccessToken"
    | "oauthTokenExpiresAt"
  >;
};

export function MCPServerDialog({
  open,
  onOpenChange,
  server,
}: MCPServerDialogProps) {
  const isEdit = !!server;
  const utils = api.useUtils();

  const [headers, setHeaders] = useState<HeaderEntry[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    tools?: { name: string; description: string }[];
    error?: string;
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    connected: boolean;
    toolCount?: number;
    error?: string;
  } | null>(null);

  const form = useForm<MCPServerFormValues>({
    resolver: zodResolver(mcpServerSchema),
    defaultValues: {
      name: "",
      url: "",
      transportType: "http",
    },
  });

  useEffect(() => {
    if (open) {
      if (server) {
        form.reset({
          name: server.name,
          url: server.url,
          transportType: server.transportType,
        });
        if (server.headers) {
          setHeaders(
            Object.entries(server.headers).map(([key, value]) => ({
              key,
              value,
            })),
          );
        } else {
          setHeaders([]);
        }
      } else {
        form.reset({
          name: "",
          url: "",
          transportType: "http",
        });
        setHeaders([]);
      }
      setTestResult(null);
      setConnectionStatus(null);
    }
  }, [open, server, form]);

  const createMutation = api.apps.mcp.create.useMutation({
    onSuccess: () => {
      toast.success("MCP server added");
      utils.apps.mcp.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add MCP server");
    },
  });

  const updateMutation = api.apps.mcp.update.useMutation({
    onSuccess: () => {
      toast.success("MCP server updated");
      utils.apps.mcp.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update MCP server");
    },
  });

  const testMutation = api.apps.mcp.test.useMutation({
    onSuccess: (data) => {
      setTestResult({
        success: true,
        tools: data.tools,
      });
    },
    onError: (error) => {
      setTestResult({
        success: false,
        error: error.message,
      });
    },
  });

  const checkConnectionMutation = api.apps.mcp.checkConnection.useMutation({
    onSuccess: (result) => {
      setConnectionStatus({
        checked: true,
        connected: result.connected,
        toolCount: result.toolCount,
        error: result.error,
      });
    },
    onError: (error) => {
      setConnectionStatus({
        checked: true,
        connected: false,
        error: error.message,
      });
    },
  });

  const handleCheckConnection = () => {
    if (server?.id) {
      setConnectionStatus(null);
      checkConnectionMutation.mutate({ id: server.id });
    }
  };

  const onSubmit = (values: MCPServerFormValues) => {
    const headersObj =
      headers.length > 0
        ? headers.reduce(
            (acc, { key, value }) => {
              if (key.trim()) {
                acc[key.trim()] = value;
              }
              return acc;
            },
            {} as Record<string, string>,
          )
        : undefined;

    if (isEdit && server) {
      updateMutation.mutate({
        id: server.id,
        name: values.name,
        url: values.url,
        transportType: values.transportType,
        headers: headersObj ?? null,
      });
    } else {
      createMutation.mutate({
        name: values.name,
        url: values.url,
        transportType: values.transportType,
        headers: headersObj,
      });
    }
  };

  const handleTest = () => {
    const values = form.getValues();
    if (!values.url) {
      toast.error("Please enter a URL first");
      return;
    }

    const headersObj =
      headers.length > 0
        ? headers.reduce(
            (acc, { key, value }) => {
              if (key.trim()) {
                acc[key.trim()] = value;
              }
              return acc;
            },
            {} as Record<string, string>,
          )
        : undefined;

    setTestResult(null);
    testMutation.mutate({
      url: values.url,
      transportType: values.transportType,
      headers: headersObj,
    });
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    testMutation.isPending ||
    checkConnectionMutation.isPending;

  const isOAuthConnected = !!server?.oauthAccessToken;
  const tokenExpiresAt = server?.oauthTokenExpiresAt
    ? new Date(server.oauthTokenExpiresAt)
    : null;
  const isTokenExpired = tokenExpiresAt ? tokenExpiresAt < new Date() : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} MCP Server</DialogTitle>
          <DialogDescription>
            Connect to a Model Context Protocol server to use its tools.
          </DialogDescription>
        </DialogHeader>

        {isEdit && isOAuthConnected && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    isTokenExpired ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
                <span className="font-medium text-sm">
                  {isTokenExpired ? "OAuth Expired" : "OAuth Connected"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCheckConnection}
                disabled={checkConnectionMutation.isPending}
              >
                <RefreshCw
                  className={cn(
                    "mr-1 size-3",
                    checkConnectionMutation.isPending && "animate-spin",
                  )}
                />
                Check
              </Button>
            </div>
            {tokenExpiresAt && (
              <p className="mt-1 text-muted-foreground text-xs">
                {isTokenExpired ? "Expired" : "Expires"}:{" "}
                {tokenExpiresAt.toLocaleString()}
              </p>
            )}
            {connectionStatus?.checked && (
              <div
                className={cn(
                  "mt-3 flex items-center gap-2 rounded-md p-2 text-sm",
                  connectionStatus.connected
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {connectionStatus.connected ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>
                      Connection OK - {connectionStatus.toolCount} tools
                      available
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" />
                    <span>{connectionStatus.error}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My MCP Server"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/mcp"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transport Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="http">HTTP (Recommended)</SelectItem>
                      <SelectItem value="sse">SSE</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">Headers</span>
                  <p className="text-muted-foreground text-xs">
                    Add custom headers for authentication or other purposes
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addHeader}
                  disabled={isPending}
                >
                  <Plus className="mr-1 size-4" />
                  Add
                </Button>
              </div>
              {headers.map((header, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    disabled={isPending}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={header.value}
                    onChange={(e) =>
                      updateHeader(index, "value", e.target.value)
                    }
                    disabled={isPending}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {!isOAuthConnected && testResult && (
              <div
                className={cn(
                  "rounded-lg p-3 text-sm",
                  testResult.success
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {testResult.success ? (
                  <div>
                    <p className="font-medium">
                      Connection successful! Found {testResult.tools?.length}{" "}
                      tool(s):
                    </p>
                    {testResult.tools && testResult.tools.length > 0 && (
                      <ul className="mt-1 list-inside list-disc">
                        {testResult.tools.slice(0, 5).map((tool) => (
                          <li key={tool.name} className="truncate">
                            {tool.name}
                          </li>
                        ))}
                        {testResult.tools.length > 5 && (
                          <li>...and {testResult.tools.length - 5} more</li>
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p>{testResult.error}</p>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              {!isOAuthConnected && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isPending}
                >
                  {testMutation.isPending && (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  )}
                  Test Connection
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                )}
                {isEdit ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
