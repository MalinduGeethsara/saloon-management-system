import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettings() {
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-700">Maintenance Mode</p>
              <p className="text-xs text-gray-400">Disable booking system for customers during updates.</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full cursor-pointer relative">
               <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm" />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-700">Backup Retention Policy</p>
              <p className="text-xs text-gray-400">Current: Keep last 12 weeks of data.</p>
            </div>
            <select className="text-sm border rounded p-1">
              <option>12 Weeks</option>
              <option>24 Weeks</option>
              <option>Indefinite</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}