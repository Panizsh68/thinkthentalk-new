"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { TeamMember, TeamMemberFormData } from "@/lib/types";
import { useDeleteUploadedFile, useUploadTeamMember } from "@/hooks/use-upload";
import { X, Loader2 } from "lucide-react";
import {
  getUploadedFilePath,
  isUploadUrl,
  normalizeUploadedFileUrl,
  sameUploadedFilePath,
} from "@/lib/uploads";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const getTeamMemberSchema = (t: (key: string) => string) =>
  z.object({
    firstNameFa: z
      .string()
      .trim()
      .min(1, t("registration.validation.required")),
    lastNameFa: z.string().trim().min(1, t("registration.validation.required")),
    roleFa: z.string().trim().min(1, t("registration.validation.required")),
    firstNameEn: z
      .string()
      .trim()
      .min(1, t("registration.validation.required")),
    lastNameEn: z.string().trim().min(1, t("registration.validation.required")),
    roleEn: z.string().trim().min(1, t("registration.validation.required")),
    avatarUrl: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || isUploadUrl(value),
        t("admin.team.validation.invalidImage"),
      ),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  });

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  isSubmitting: boolean;
  onSubmit: (data: TeamMemberFormData) => Promise<void>;
  onCleanupWarning?: () => void;
}

export function TeamMemberFormDialog({
  open,
  onOpenChange,
  member,
  isSubmitting,
  onSubmit,
  onCleanupWarning,
}: TeamMemberFormDialogProps) {
  const { t } = useLanguage();
  const { mutateAsync: uploadPhoto, isPending: isUploading } =
    useUploadTeamMember();
  const { mutateAsync: deleteUploadedFile, isPending: isDeletingFile } =
    useDeleteUploadedFile();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(getTeamMemberSchema(t)),
    defaultValues: {
      firstNameFa: "",
      lastNameFa: "",
      roleFa: "",
      firstNameEn: "",
      lastNameEn: "",
      roleEn: "",
      avatarUrl: "",
      displayOrder: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setUploadError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (member) {
      form.reset({
        firstNameFa: member.firstNameFa,
        lastNameFa: member.lastNameFa,
        roleFa: member.roleFa,
        firstNameEn: member.firstNameEn ?? "",
        lastNameEn: member.lastNameEn ?? "",
        roleEn: member.roleEn ?? "",
        avatarUrl: normalizeUploadedFileUrl(member.avatarUrl),
        displayOrder: member.displayOrder,
        isActive: member.isActive,
      });
    } else {
      form.reset({
        firstNameFa: "",
        lastNameFa: "",
        roleFa: "",
        firstNameEn: "",
        lastNameEn: "",
        roleEn: "",
        avatarUrl: "",
        displayOrder: undefined,
        isActive: true,
      });
    }
  }, [member, open, form]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleValidSubmit = async (values: TeamMemberFormData) => {
    setUploadError(null);
    const currentPath = getUploadedFilePath(member?.avatarUrl);
    let replacementUrl = values.avatarUrl.trim();
    let replacementPath = getUploadedFilePath(replacementUrl);

    try {
      if (selectedFile) {
        const uploaded = await uploadPhoto(selectedFile);
        replacementUrl = normalizeUploadedFileUrl(uploaded.url);
        replacementPath = getUploadedFilePath(replacementUrl);
      }

      await onSubmit({
        ...values,
        firstNameFa: values.firstNameFa.trim(),
        lastNameFa: values.lastNameFa.trim(),
        roleFa: values.roleFa.trim(),
        firstNameEn: values.firstNameEn.trim(),
        lastNameEn: values.lastNameEn.trim(),
        roleEn: values.roleEn.trim(),
        avatarUrl: replacementUrl,
      });

      if (currentPath && !sameUploadedFilePath(currentPath, replacementPath)) {
        try {
          await deleteUploadedFile(currentPath);
        } catch {
          onCleanupWarning?.();
        }
      }
    } catch (error: unknown) {
      if (
        selectedFile &&
        replacementPath &&
        !sameUploadedFilePath(currentPath, replacementPath)
      ) {
        try {
          await deleteUploadedFile(replacementPath);
        } catch {
          onCleanupWarning?.();
        }
      }
      setUploadError(t("admin.team.form.saveError"));
      throw error;
    }
  };

  const displayedImage = previewUrl || form.watch("avatarUrl");
  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
      setUploadError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {member ? t("admin.team.edit.title") : t("admin.team.create.title")}
          </DialogTitle>
          <DialogDescription>
            {member
              ? t("admin.team.edit.subtitle")
              : t("admin.team.create.subtitle")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (values) => void handleValidSubmit(values),
            )}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstNameFa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.team.form.firstNameFa")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastNameFa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.team.form.lastNameFa")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleFa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.team.form.roleFa")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstNameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.team.form.firstNameEn")}</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastNameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.team.form.lastNameEn")}</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.team.form.roleEn")}</FormLabel>
                    <FormControl>
                      <Input dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.team.form.photoUrl")}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isSubmitting || isUploading}
                        onChange={(event) => {
                          handleFileSelected(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                      {isUploading && (
                        <p
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                          role="status"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          {t("admin.team.form.uploading")}
                        </p>
                      )}
                      {uploadError && (
                        <p className="text-sm text-destructive" role="alert">
                          {uploadError}
                        </p>
                      )}
                      {displayedImage && (
                        <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                          <img
                            src={displayedImage}
                            alt={t("admin.team.form.imageAlt")}
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6"
                            onClick={() => {
                              setSelectedFile(null);
                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                              setPreviewUrl(null);
                              field.onChange("");
                            }}
                            aria-label={t("admin.team.form.removePhoto")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("admin.team.form.photoDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.team.form.displayOrder")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>{t("admin.team.form.isActive")}</FormLabel>
                    <FormDescription>
                      {t("admin.team.form.isActiveDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isSubmitting || isUploading}
              >
                {t("admin.resources.form.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading || isDeletingFile}
              >
                {(isSubmitting || isUploading || isDeletingFile) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {member
                  ? t("admin.resources.form.save")
                  : t("admin.resources.form.add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
