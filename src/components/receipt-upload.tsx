"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReceiptUploadProps {
  expenseId: Id<"expenses">;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function ReceiptUpload({ expenseId }: ReceiptUploadProps) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createReceipt = useMutation(api.receipts.createReceipt);
  const deleteReceipt = useMutation(api.receipts.deleteReceipt);
  const receipts = useQuery(api.receipts.getByExpense, { expenseId });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and PDF files are accepted.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be under 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      await createReceipt({
        expenseId,
        fileUrl: storageId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDeleteReceipt = async (receiptId: Id<"receipts">) => {
    await deleteReceipt({ receiptId });
  };

  const FileIcon = ({ type }: { type: string }) =>
    type === "application/pdf" ? (
      <FileText className="h-8 w-8 text-destructive" />
    ) : (
      <Image className="h-8 w-8 text-info" />
    );

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Receipts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30">
            {error}
          </div>
        )}

        <div
          className={cn(
            "border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop a file here or click to upload
              </p>
              <p className="text-xs text-muted-foreground/60">
                JPEG, PNG, or PDF up to 10MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        {receipts && receipts.length > 0 && (
          <div className="space-y-2">
            {receipts.map((receipt: any) => (
              <div
                key={receipt._id}
                className="flex items-center gap-3 p-2 border border-border bg-muted/30"
              >
                <FileIcon type={receipt.fileType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{receipt.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(receipt.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteReceipt(receipt._id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}