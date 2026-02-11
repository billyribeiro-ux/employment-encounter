"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateDocument } from "@/lib/hooks/use-documents";

const schema = z.object({
  name: z.string().min(1, "Document name is required"),
  mime_type: z.string().min(1, "File type is required"),
  size_bytes: z.number().min(1, "File size required"),
  client_id: z.string().optional(),
  category: z.string().optional(),
  tax_year: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

export function UploadDocumentDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const createDocument = useCreateDocument();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      mime_type: "",
      size_bytes: 0,
      client_id: "",
      category: "",
      tax_year: new Date().getFullYear(),
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("name", file.name);
      form.setValue("mime_type", file.type || "application/octet-stream");
      form.setValue("size_bytes", file.size);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      await createDocument.mutateAsync({
        name: values.name,
        mime_type: values.mime_type,
        size_bytes: values.size_bytes,
        client_id: values.client_id || undefined,
        category: values.category || undefined,
        tax_year: values.tax_year || undefined,
      });
      toast.success("Document created. Upload to S3 when presigned URLs are configured.");
      form.reset();
      setSelectedFile(null);
      setOpen(false);
    } catch {
      toast.error("Failed to create document record");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Select a file and add metadata for AI categorization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>File</FormLabel>
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB ·{" "}
                        {selectedFile.type || "unknown type"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        Click to select a file
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, XLSX, DOCX, CSV, images up to 50MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Document name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...field}
                      >
                        <option value="">Auto-detect (AI)</option>
                        <option value="tax_return">Tax Return</option>
                        <option value="financial_statement">Financial Statement</option>
                        <option value="w2">W-2</option>
                        <option value="1099">1099</option>
                        <option value="receipt">Receipt</option>
                        <option value="contract">Contract</option>
                        <option value="correspondence">Correspondence</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2000"
                        max="2030"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Client UUID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDocument.isPending || !selectedFile}
              >
                {createDocument.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
