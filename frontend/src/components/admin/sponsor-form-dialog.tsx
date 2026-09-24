"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/lib/i18n/language-provider";
import type { Sponsor, SponsorFormData } from "@/lib/types";
import {
  useDeleteUploadedFile,
  useUploadSponsorLogo,
} from "@/hooks/use-upload";
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
import { Loader2, X } from "lucide-react";

const getSponsorSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("registration.validation.required")),
    productOrTagline: z
      .string()
      .trim()
      .min(1, t("registration.validation.required")),
    logoUrl: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || isUploadUrl(value),
        t("admin.sponsors.validation.invalidUrl"),
      ),
    websiteUrl: z
      .string()
      .trim()
      .url(t("admin.sponsors.validation.invalidUrl"))
      .optional()
      .or(z.literal("")),
  });

interface SponsorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor: Sponsor | null;
  isSubmitting: boolean;
  onSubmit: (data: SponsorFormData) => Promise<void>;
  onCleanupWarning?: () => void;
}

export function SponsorFormDialog({
  open,
  onOpenChange,
  sponsor,
  isSubmitting,
  onSubmit,
  onCleanupWarning,
}: SponsorFormDialogProps) {
  const { t } = useLanguage();
  const { mutateAsync: uploadLogo, isPending: isUploading } =
    useUploadSponsorLogo();
  const { mutateAsync: deleteUploadedFile, isPending: isDeletingFile } =
    useDeleteUploadedFile();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<SponsorFormData>({
    resolver: zodResolver(getSponsorSchema(t)),
    defaultValues: {
      name: "",
      productOrTagline: "",
      logoUrl: "",
      websiteUrl: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setUploadError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset(
      sponsor
        ? {
            ...sponsor,
            logoUrl: normalizeUploadedFileUrl(sponsor.logoUrl),
            websiteUrl: sponsor.websiteUrl ?? "",
          }
        : { name: "", productOrTagline: "", logoUrl: "", websiteUrl: "" },
    );
  }, [sponsor, open, form]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
  };

  const handleValidSubmit = async (values: SponsorFormData) => {
    setUploadError(null);
    if (!values.logoUrl.trim() && !selectedFile) {
      form.setError("logoUrl", {
        type: "required",
        message: t("registration.validation.required"),
      });
      return;
    }
    const currentPath = getUploadedFilePath(sponsor?.logoUrl);
    let logoUrl = values.logoUrl.trim();
    let replacementPath = getUploadedFilePath(logoUrl);

    try {
      if (selectedFile) {
        const uploaded = await uploadLogo(selectedFile);
        logoUrl = normalizeUploadedFileUrl(uploaded.url);
        replacementPath = getUploadedFilePath(logoUrl);
      }
      await onSubmit({
        name: values.name.trim(),
        productOrTagline: values.productOrTagline.trim(),
        logoUrl,
        websiteUrl: values.websiteUrl?.trim() || "",
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
      setUploadError(t("admin.sponsors.form.saveError"));
      throw error;
    }
  };

  const displayedImage = previewUrl || form.watch("logoUrl");
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
            {sponsor
              ? t("admin.sponsors.edit.title")
              : t("admin.sponsors.create.title")}
          </DialogTitle>
          <DialogDescription>
            {sponsor
              ? t("admin.sponsors.edit.subtitle")
              : t("admin.sponsors.create.subtitle")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (values) => void handleValidSubmit(values),
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.sponsors.form.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productOrTagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.sponsors.form.tagline")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.sponsors.form.logoUrl")}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
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
                          {t("admin.sponsors.form.uploading")}
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
                            alt={t("admin.sponsors.form.imageAlt")}
                            className="h-full w-full object-contain p-2"
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
                            aria-label={t("admin.sponsors.form.removeLogo")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("admin.sponsors.form.logoDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.sponsors.form.websiteUrl")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" {...field} />
                  </FormControl>
                  <FormMessage />
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
                {sponsor
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
