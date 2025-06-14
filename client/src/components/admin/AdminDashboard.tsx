import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, TrendingUp, Download, Bot } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MatchingEngine } from "./MatchingEngine";
import { apiRequest, throwIfResNotOk } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { debugLog } from "@/lib/logger";

export const AdminDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: unverifiedEmployers } = useQuery({
    queryKey: ["/api/admin/unverified-employers"],
  });

  const { data: unverifiedCandidates } = useQuery({
    queryKey: ["/api/admin/unverified-candidates"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const verifyEmployerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/employers/${id}/verify`, "PATCH");
      await throwIfResNotOk(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unverified-employers"] });
      toast({ title: "Employer verified" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const verifyCandidateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/candidates/${id}/verify`, "PATCH");
      await throwIfResNotOk(res);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unverified-candidates"] });
      toast({ title: "Candidate verified" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const handleExportData = () => {
    // Implement export functionality
    debugLog("Exporting data...");
  };

  const handleRunMatching = () => {
    // Implement AI matching
    debugLog("Running AI matching...");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={handleRunMatching} className="bg-green-600 hover:bg-green-700">
            <Bot className="h-4 w-4 mr-2" />
            Run Matching
          </Button>
        </div>
      </div>

      {/* Verification queues */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Unverified Employers</CardTitle>
          </CardHeader>
          <CardContent>
            {(unverifiedEmployers || []).map((emp: any) => (
              <div key={emp.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>{emp.organizationName}</span>
                <Button size="sm" onClick={() => verifyEmployerMutation.mutate(emp.id)} disabled={verifyEmployerMutation.isPending}>
                  Verify
                </Button>
              </div>
            ))}
            {(unverifiedEmployers || []).length === 0 && <p className="text-sm text-muted-foreground">None</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unverified Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            {(unverifiedCandidates || []).map((cand: any) => (
              <div key={cand.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>{cand.userId}</span>
                <Button size="sm" onClick={() => verifyCandidateMutation.mutate(cand.id)} disabled={verifyCandidateMutation.isPending}>
                  Verify
                </Button>
              </div>
            ))}
            {(unverifiedCandidates || []).length === 0 && <p className="text-sm text-muted-foreground">None</p>}
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.candidates || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+12%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.jobs || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+8%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful Matches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.matches || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+24%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Match Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.matchRate || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">+3.2%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matching Engine */}
      <MatchingEngine />
    </div>
  );
};
