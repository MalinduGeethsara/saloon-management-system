"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, RefreshCw, CheckCircle2 } from "lucide-react";

export default function AdminBackups() {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const runManualBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => setIsBackingUp(false), 2000);  
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1B]">Data Backups</h1>
          <p className="text-gray-500">Manage automated weekly backups and manual snapshots.</p>
        </div>
        <button 
          onClick={runManualBackup}
          disabled={isBackingUp}
          className="flex items-center gap-2 bg-[#1A1A1B] text-[#C5A059] px-6 py-2 rounded-lg font-bold hover:bg-black transition disabled:opacity-50"
        >
          <RefreshCw size={18} className={isBackingUp ? "animate-spin" : ""} />
          {isBackingUp ? "Backing up..." : "Create Manual Backup"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} /> Weekly Auto-Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">Active</div>
            <p className="text-xs text-emerald-600 mt-1">Next: Sunday, 12:00 AM</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Backup ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs uppercase text-gray-400">bk_auto_020126</TableCell>
                <TableCell>Feb 1, 2026</TableCell>
                <TableCell>142.5 MB</TableCell>
                <TableCell><span className="text-emerald-500 font-medium">Success</span></TableCell>
                <TableCell className="text-right">
                  <button className="text-[#C5A059] hover:underline flex items-center gap-1 ml-auto">
                    <Download size={16} /> Download
                  </button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}