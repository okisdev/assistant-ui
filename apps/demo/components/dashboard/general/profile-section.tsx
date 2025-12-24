"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { workTypeOptions, type WorkType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/form";
import { SettingHeader } from "@/components/dashboard/setting-header";

const profileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100),
  nickname: z.string().max(50).optional(),
  workType: z
    .enum(workTypeOptions.map((o) => o.value) as [WorkType, ...WorkType[]])
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileSection() {
  const { data: profile, isPending } = api.user.profile.get.useQuery();
  const utils = api.useUtils();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      nickname: "",
      workType: undefined,
    },
  });

  const updateProfileMutation = api.user.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.user.profile.get.invalidate();
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        nickname: profile.nickname ?? "",
        workType: (profile.workType as WorkType) ?? undefined,
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate({
      name: values.name.trim(),
      nickname: values.nickname?.trim() || null,
      workType: values.workType ?? null,
    });
  };

  const isDisabled = isPending || updateProfileMutation.isPending;

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Profile" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-[1fr_10rem] gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      disabled={isDisabled}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nickname"
                      disabled={isDisabled}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="workType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What best describes your work?</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your work type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {form.formState.isDirty && (
            <div className="fade-in slide-in-from-bottom-2 flex animate-in justify-end duration-200">
              <Button type="submit" disabled={isDisabled}>
                {updateProfileMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
