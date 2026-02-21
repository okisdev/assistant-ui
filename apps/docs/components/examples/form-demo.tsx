"use client";

import { AssistantSidebar } from "@/components/assistant-ui/assistant-sidebar";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useAssistantForm } from "@assistant-ui/react-hook-form";
import { useAssistantInstructions } from "@assistant-ui/react";
import { useState } from "react";

const SetFormFieldTool = () => {
  return (
    <p className="text-center font-bold font-mono text-blue-500 text-sm">
      set_form_field(...)
    </p>
  );
};

const SubmitFormTool = () => {
  return (
    <p className="text-center font-bold font-mono text-blue-500 text-sm">
      submit_form(...)
    </p>
  );
};

export const FormDemo = () => {
  useAssistantInstructions("Help users sign up for Simon's hackathon.");

  const form = useAssistantForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      cityAndCountry: "",
      projectIdea: "",
      proficientTechnologies: "",
    },
    assistant: {
      tools: {
        set_form_field: {
          render: SetFormFieldTool,
        },
        submit_form: {
          render: SubmitFormTool,
        },
      },
    },
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <AssistantSidebar>
      <div className="h-full overflow-y-auto">
        <main className="container py-8">
          <h1 className="mb-2 font-semibold text-2xl">
            Simon&apos;s Hackathon
          </h1>
          <p>
            I&apos;m hosting a Hackathon on AI UX. Be the first to get an
            invite!
          </p>

          {isSubmitted ? (
            <p className="my-4 font-bold text-green-600">
              Thank you for signing up, you will hear from me soon!
            </p>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-4 space-y-4"
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormDescription>Your first name.</FormDescription>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormDescription>Your last name.</FormDescription>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormDescription>Your email.</FormDescription>
                      <FormControl>
                        <Input placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cityAndCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormDescription>
                        The city and country you live in.
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectIdea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idea</FormLabel>
                      <FormDescription>
                        Do you have an idea for a project?
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="Idea" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="proficientTechnologies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technologies</FormLabel>
                      <FormDescription>
                        What technologies are you most comfortable with?
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="Next.js, Tailwind CSS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Submit</Button>
              </form>
            </Form>
          )}
        </main>
      </div>
    </AssistantSidebar>
  );
};
