// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  Copy, 
  Edit, 
  Eye, 
  Users, 
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, throwIfResNotOk } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDistanceToNow } from "date-fns";

interface Job {
  id: number;
  title: string;
  description: string;
  minQualification: string;
  experienceRequired: string;
  skills: string;
  responsibilities: string;
  vacancy: number;
  location: string;
  salaryRange: string;
  jobCode: string;
  isActive: boolean;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'dormant' | 'fulfilled';
  daysSinceCreated?: number;
}

export const EmployerJobs: React.FC = () => {
  const [, setLocation] = useLocation();
  const { userProfile } = useAuth();
  const isVerified = userProfile?.employer?.profileStatus === "verified";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.length >= 3 ? searchTerm : "");
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/employers/jobs", { search: debouncedSearchTerm, filter: filterStatus, sort: sortBy }],
    enabled: !!userProfile?.employer,
  });

  const markAsFulfilledMutation = useMutation({
    mutationFn: async (jobId: number) => {
      try {
        const response = await apiRequest(`/api/jobs/${jobId}/fulfill`, "PATCH");
        await throwIfResNotOk(response);
        return response.json();
      } catch (error) {
        console.error('Job fulfillment error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate all employer-related queries to ensure dashboard updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/fulfilled-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/applications"] }),
      ]);
      
      // Force immediate refetch with await to ensure synchronous update
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/jobs"] }),
      ]);
      
      toast({
        title: "Job marked as fulfilled",
        description: "The job posting has been marked as fulfilled successfully",
      });
    },
    onError: (error: any) => {
      console.error('Job fulfillment mutation error:', error);
      toast({
        title: "Failed to update job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const activateJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      try {
        const response = await apiRequest(`/api/jobs/${jobId}/activate`, "PATCH");
        await throwIfResNotOk(response);
        return response.json();
      } catch (error) {
        console.error('Job activation error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate all employer-related queries to ensure dashboard updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/fulfilled-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/employers/applications"] }),
      ]);
      
      // Force immediate refetch with await to ensure synchronous update
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/employers/stats"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/recent-jobs"] }),
        queryClient.refetchQueries({ queryKey: ["/api/employers/jobs"] }),
      ]);
      
      toast({
        title: "Job activated",
        description: "The job posting has been activated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Job activation mutation error:', error);
      toast({
        title: "Failed to activate job",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleCloneJob = (job: Job) => {
    const cloneData = {
      title: `Copy of ${job.title}`,
      description: job.description,
      minQualification: job.minQualification,
      experienceRequired: job.experienceRequired,
      skills: job.skills,
      salaryRange: job.salaryRange,
      location: job.location,
      responsibilities: job.responsibilities,
      vacancy: job.vacancy,
    };
    
    setLocation(`/jobs/create?clone=${encodeURIComponent(JSON.stringify(cloneData))}&from=jobs`);
  };

  const getJobStatus = (job: Job) => {
    const daysSinceCreated = Math.floor(
      (new Date().getTime() - new Date(job.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (job.fulfilled) return 'fulfilled';
    if (!job.isActive || daysSinceCreated > 90) return 'dormant';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'dormant':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400';
      case 'fulfilled':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'dormant':
        return <Clock className="h-4 w-4" />;
      case 'fulfilled':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const sortedAndFilteredJobs = React.useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];

    let filteredJobs = jobs.filter((job: Job) => {
      const status = getJobStatus(job);
      const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.jobCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });

    // Sort jobs
    filteredJobs.sort((a: Job, b: Job) => {
      // Within same status, sort by specified criteria
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'applications') {
        return (b.applicationsCount || 0) - (a.applicationsCount || 0);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      
      return 0;
    });

    return filteredJobs;
  }, [jobs, searchTerm, filterStatus, sortBy, getJobStatus]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse bg-card border-border">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Posts</h1>
          <p className="text-muted-foreground">
            Manage your job postings and track applications
          </p>
        </div>
        <Link href={isVerified ? "/jobs/create?from=jobs" : undefined}>
          <Button
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
            disabled={!isVerified}
          >
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs by title, location, or job code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-background border-border">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="applications">Most Applications</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {sortedAndFilteredJobs.length > 0 ? (
        <div className="space-y-4">
          {sortedAndFilteredJobs.map((job: Job) => {
            const status = getJobStatus(job);
            const daysSinceCreated = Math.floor((new Date().getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            
            const getCardClassName = (status: string) => {
              let baseClasses = "border-border transition-colors";
              
              if (status === 'fulfilled') {
                baseClasses += " bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30";
              } else if (status === 'dormant') {
                baseClasses += " bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30";
              } else {
                baseClasses += " bg-card hover:bg-accent/50 dark:hover:bg-accent/20";
              }
              
              return baseClasses;
            };
            
            return (
              <Card key={job.id} className={getCardClassName(status)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1 capitalize">{status}</span>
                        </Badge>
                        {status === 'dormant' && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            {daysSinceCreated}+ days old
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job.applicationsCount || 0} applications
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.jobCode}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="mt-3">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {job.salaryRange}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      
                      {isVerified && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          {status !== 'fulfilled' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/jobs/${job.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Job
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleCloneJob(job)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone Job
                          </DropdownMenuItem>
                          
                          {status !== 'fulfilled' && <DropdownMenuSeparator />}
                          
                          {status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => {
                                try {
                                  markAsFulfilledMutation.mutate(job.id);
                                } catch (error) {
                                  console.error('Fulfillment error:', error);
                                }
                              }}
                              disabled={markAsFulfilledMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {markAsFulfilledMutation.isPending ? "Marking..." : "Mark as Fulfilled"}
                            </DropdownMenuItem>
                          )}
                          
                          {status === 'dormant' && (
                            <DropdownMenuItem onClick={() => activateJobMutation.mutate(job.id)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Activate Job
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-16 w-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filterStatus !== "all" ? "No jobs found" : "No job posts yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Start hiring by posting your first job"
              }
            </p>
            {(!searchTerm && filterStatus === "all") && (
              <Link href={isVerified ? "/jobs/create?from=jobs" : undefined}>
                <Button
                  className="bg-primary hover:bg-primary-dark text-primary-foreground"
                  disabled={!isVerified}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {sortedAndFilteredJobs.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Showing {sortedAndFilteredJobs.length} of {jobs?.length || 0} job posts
              </span>
              <div className="flex gap-4">
                <span>Active: {jobs?.filter((j: Job) => getJobStatus(j) === 'active').length || 0}</span>
                <span>Dormant: {jobs?.filter((j: Job) => getJobStatus(j) === 'dormant').length || 0}</span>
                <span>Fulfilled: {jobs?.filter((j: Job) => getJobStatus(j) === 'fulfilled').length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};