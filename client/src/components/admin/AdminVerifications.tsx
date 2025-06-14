import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, throwIfResNotOk } from "../../lib/queryClient";
import {
  Filter,
  Search,
  SortAsc,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Building2,
  FileText,
  Clock,
  Calendar
} from "lucide-react";

export const AdminVerifications: React.FC = () => {
  const [type, setType] = useState("candidate");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch pending verifications based on type
  const { data: verifications = [], isLoading } = useQuery({
    queryKey: [`/api/admin/verifications/${type}`],
    enabled: !!type
  });

  // Mutations for verification actions
  const verifyMutation = useMutation({
    mutationFn: async ({ id, type, action }: { id: number; type: string; action: 'approve' | 'reject' }) => {
      const response = await apiRequest(`/api/admin/${type}s/${id}/${action}`, "PATCH");
      await throwIfResNotOk(response);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/verifications/${variables.type}`] });
      toast({
        title: "Success",
        description: `\${variables.type} \${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process verification",
        variant: "destructive",
      });
    },
  });

  // Helper function to format dates
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Card renderer based on type
  const renderCard = (item: any) => {
    const isCandidate = type === "candidate";
    const isEmployer = type === "employer";
    const isJob = type === "job";

    return (
      <Card key={item.id} className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isCandidate && <User className="h-5 w-5 text-primary" />}
                {isEmployer && <Building2 className="h-5 w-5 text-primary" />}
                {isJob && <FileText className="h-5 w-5 text-primary" />}
                <span className="font-semibold text-foreground">
                  {isCandidate ? item.name : isEmployer ? item.organizationName : item.title}
                </span>
                <Badge variant="secondary">Pending</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                {isCandidate && (
                  <>
                    <div>{item.email}</div>
                    <div>{item.qualification} • {item.experience}</div>
                  </>
                )}
                {isEmployer && (
                  <>
                    <div>{item.industry}</div>
                    <div>{item.size} employees • {item.location}</div>
                  </>
                )}
                {isJob && (
                  <>
                    <div>{item.employer}</div>
                    <div>{item.location} • Posted {formatDate(item.createdAt)}</div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Submitted {formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyMutation.mutate({ id: item.id, type, action: 'approve' })}
                disabled={verifyMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyMutation.mutate({ id: item.id, type, action: 'reject' })}
                disabled={verifyMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Pending Verifications</h1>
      </div>

      {/* Top Bar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Tabs value={type} onValueChange={setType} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="candidate">Candidates</TabsTrigger>
            <TabsTrigger value="employer">Employers</TabsTrigger>
            <TabsTrigger value="job">Job Posts</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 bg-background border-border"
            placeholder="Search pending verifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSort("latest")}>Latest First</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("oldest")}>Oldest First</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Verification List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading verifications...</p>
          </div>
        ) : verifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                No pending verifications for {type}s at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          verifications.map(renderCard)
        )}
      </div>
    </div>
  );
};
