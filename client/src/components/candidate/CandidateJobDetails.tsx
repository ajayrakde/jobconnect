import React from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Calendar, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const CandidateJobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery({
    queryKey: [`/api/candidates/jobs/${id}`],
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/candidates/jobs/${id}/apply`, "POST");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/candidates/applications"] });
      toast({ title: "Application submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleApply = () => {
    applyMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <p className="text-muted-foreground">Job not found</p>
          <Link href="/candidate/jobs">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link href="/candidate/jobs">
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{job.title}</span>
            {job.jobCode && (
              <Badge variant="outline" className="border-border text-xs">
                {job.jobCode}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                {job.salaryRange}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Job Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {job.description || "No description provided."}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleApply}
              disabled={applyMutation.isLoading}
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
