import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2 } from "lucide-react";

export function BackupTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Backup ID</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Size</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-xs uppercase">bk_weekly_020126</TableCell>
          <TableCell>Feb 1, 2026</TableCell>
          <TableCell>142.5 MB</TableCell>
          <TableCell className="text-right flex justify-end gap-2">
            <button className="p-2 hover:text-[#C5A059]"><Download size={16}/></button>
            <button className="p-2 hover:text-red-500"><Trash2 size={16}/></button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}