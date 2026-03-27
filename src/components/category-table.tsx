"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus } from "lucide-react";

export function CategoryTable() {
  const router = useRouter();
  const categories = useQuery(api.categories.listCategories, {});
  const updateCategory = useMutation(api.categories.updateCategory);

  const handleToggleActive = async (categoryId: Id<"categories">, isActive: boolean) => {
    await updateCategory({ categoryId, isActive: !isActive });
  };

  if (!categories) {
    return <div className="p-8 text-center text-muted-foreground">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expense Categories</h2>
        <Button onClick={() => router.push("/categories/new")}>
          <Plus className="h-4 w-4 mr-1" />
          New Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border border-border">
          No categories found. Create your first category.
        </div>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat: any) => (
                <TableRow key={cat._id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {cat.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {cat.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cat.isActive}
                      onCheckedChange={() => handleToggleActive(cat._id, cat.isActive)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/categories/${cat._id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}