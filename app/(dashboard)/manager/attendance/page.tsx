"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { matchesQuery } from "@/hooks/useSearchFilter";
import dayjs from "dayjs";
import { usePagedList } from "@/hooks/usePagedList";
import { AppPagination } from "@/components/ui/AppPagination";

interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  status: string;
  clockIn: string;
  clockOut: string;
}

function AttendanceStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm py-4 gap-2 md:py-6 md:gap-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 md:px-6">
        <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">{label}</CardTitle>
        <span className="hidden sm:block">{icon}</span>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <div className="text-2xl md:text-3xl font-bold text-[#1A1A1B]">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AttendancePage() {
  const [staff, setStaff] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // Today's records only (the page is "today's attendance"): a bounded list, paged client-side
        const res = await fetch(`/api/v1/attendance?date=${dayjs().format('YYYY-MM-DD')}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.attendance) {
          setStaff(data.attendance.map((a: any) => ({
            id: a.id,
            name: a.user?.name || 'Unknown',
            role: a.user?.role || 'Staff',
            status: a.checkOut ? 'Present' : 'Active',
            clockIn: a.checkIn ? dayjs(a.checkIn).format('hh:mm A') : '-',
            clockOut: a.checkOut ? dayjs(a.checkOut).format('hh:mm A') : '-',
          })));
        }
      } catch {
        setError('Could not load attendance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const [search, setSearch] = useState("");
  const visibleStaff = staff.filter((s) => matchesQuery(search, s.name, s.role, s.status));
  const { pageItems, page, setPage, pageSize, total } = usePagedList(visibleStaff, 10);

  const presentCount = staff.filter(s => s.status === 'Present' || s.status === 'Active').length;
  const absentCount = staff.length - presentCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1B]">Staff Attendance</h1>
        <div className="text-sm text-gray-500 font-mono">
          {dayjs().format('dddd, D MMM YYYY')}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <AttendanceStat label="Total Staff" value={loading ? '—' : staff.length} icon={<Clock className="text-blue-500" />} />
        <AttendanceStat label="Present Now" value={loading ? '—' : presentCount} icon={<CheckCircle className="text-emerald-500" />} />
        <AttendanceStat label="Absent / On Leave" value={loading ? '—' : absentCount} icon={<XCircle className="text-red-500" />} />
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search staff"
          aria-label="Search staff"
          className="w-full h-11 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-base outline-none focus:border-[#7C4DFF]"
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-500 text-sm font-medium">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock-In</TableHead>
                  <TableHead>Clock-Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-10 text-sm">
                      Loading attendance...
                    </TableCell>
                  </TableRow>
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-10 text-sm">
                      No attendance records for today.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm capitalize">{s.role.toLowerCase()}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.status === 'Present' || s.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{s.clockIn}</TableCell>
                      <TableCell className="font-mono text-sm">{s.clockOut}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AppPagination current={page} pageSize={pageSize} total={total} onChange={setPage} />
    </div>
  );
}
