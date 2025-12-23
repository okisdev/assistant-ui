"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/utils/trpc/client";
import { workTypeOptions, type WorkType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[1fr_10rem] gap-4">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function ProfileSection() {
  const { data: profile, isPending } = api.user.profile.get.useQuery();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [workType, setWorkType] = useState<WorkType | "">("");

  const utils = api.useUtils();

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
      setName(profile.name);
      setNickname(profile.nickname ?? "");
      setWorkType((profile.workType as WorkType) ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      nickname: nickname.trim() || null,
      workType: workType || null,
    });
  };

  const hasChanges =
    name.trim() !== (profile?.name ?? "") ||
    nickname.trim() !== (profile?.nickname ?? "") ||
    workType !== ((profile?.workType as WorkType) ?? "");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-medium text-xl tracking-tight">Profile</h1>

      {isPending ? (
        <ProfileSkeleton />
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-5">
            <div className="grid grid-cols-[1fr_10rem] gap-4">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nickname"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="workType">
                What best describes your work?
              </FieldLabel>
              <Select
                value={workType}
                onValueChange={(value) => setWorkType(value as WorkType)}
              >
                <SelectTrigger id="workType" className="w-full">
                  <SelectValue placeholder="Select your work type" />
                </SelectTrigger>
                <SelectContent>
                  {workTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {hasChanges && (
              <div className="fade-in slide-in-from-bottom-2 flex animate-in justify-end duration-200">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </div>
            )}
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
