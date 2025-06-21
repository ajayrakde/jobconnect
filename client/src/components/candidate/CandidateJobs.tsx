import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { MapPin, DollarSign, Clock, Building, Star, Calendar, Eye } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Job {
  id: number;
  jobCode: string;
  title: string;
  description: string;
  minQualification: string;
  experienceRequired: string;
  skills: string;
  salaryRange: string;
  location: string;
  createdAt: string;
  employer: {
    organizationName: string;
  };
  compatibilityScore?: number;
  matchFactors?: {
    skillsScore: number;
    experienceScore: number;
    salaryScore: number;
    locationScore: number;
    qualificationScore: number;
  };
}

export const CandidateJobs: React.FC = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return apiRequest(`/api/candidates/jobs/${jobId}/apply`, "POST");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/candidates/applications"] });
      toast({ title: "Application submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/candidates/jobs"],
    enabled: !!userProfile?.candidate,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/candidates/applications"],
    enabled: !!userProfile?.candidate,
  });

  const appliedJobIds = new Set(
    Array.isArray(applications)
      ? applications.map((a: any) => a.jobPostId)
      : [],
  );

  const availableJobs = Array.isArray(jobs)
    ? jobs.filter((job: any) => !appliedJobIds.has(job.id))
    : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-muted rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No jobs available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We couldn't find any suitable job opportunities for you at the moment. 
          Check back later for new postings that match your profile.
        </p>
      </div>
    );
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
    return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Fair Match";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recommended Jobs</h1>
          <p className="text-muted-foreground">
            Jobs matched to your profile, sorted by compatibility and recency
          </p>
        </div>
        <Badge variant="outline" className="text-sm border-border">
          {availableJobs.length} job{availableJobs.length !== 1 ? 's' : ''} available
        </Badge>
      </div>

      <div className="space-y-4">
        {availableJobs.map((job: Job) => (
          <JobCard
            key={job.id}
            job={{
              title: job.title,
              code: job.jobCode,
              positions: job.vacancy,
              qualification: job.minQualification,
              experience: job.experienceRequired,
              city: job.location,
              jobCode: job.jobCode,
            }}
            actions={
              <div className="flex items-center gap-2">
                <Link href={`/candidate/jobs/${job.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground flex items-center gap-1"
                  onClick={() => applyMutation.mutate(job.id)}
                  disabled={applyMutation.isLoading}
                >
                  Apply
                </Button>
              </div>}
          >
          </JobCard>
        ))}
      </div>
    </div>
  );
};