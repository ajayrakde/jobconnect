import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Clock, Building, Star, Calendar } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
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

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/candidates/recommended-jobs"],
    enabled: !!userProfile?.candidate,
  });

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
          {Array.isArray(jobs) ? jobs.length : 0} job{Array.isArray(jobs) && jobs.length !== 1 ? 's' : ''} available
        </Badge>
      </div>

      <div className="space-y-4">
        {jobs.map((job: Job) => (
          <JobCard
            key={job.id}
            job={{
              title: job.title,
              positions: job.vacancy,
              qualification: job.minQualification,
              experience: job.experienceRequired,
              city: job.location,
              postedOn: formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }),
            }}
            actions={<Badge variant="outline" className="border-border">{job.jobCode}</Badge>}
          >
            <div className="flex items-center gap-2 mb-2">
              {job.compatibilityScore && (
                <Badge className={getCompatibilityColor(job.compatibilityScore)}>
                  <Star className="h-3 w-3 mr-1" />
                  {job.compatibilityScore}% {getCompatibilityLabel(job.compatibilityScore)}
                </Badge>
              )}
            </div>

            <p className="text-foreground mb-4 line-clamp-3">{job.description}</p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">Experience Required</h4>
                <p className="text-sm text-muted-foreground">{job.experienceRequired}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">Minimum Qualification</h4>
                <p className="text-sm text-muted-foreground">{job.minQualification}</p>
              </div>

              {job.skills && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-foreground mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {job.skills.split(',').slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-secondary text-secondary-foreground">
                        {skill.trim()}
                      </Badge>
                    ))}
                    {job.skills.split(',').length > 5 && (
                      <Badge variant="outline" className="text-xs border-border">
                        +{job.skills.split(',').length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {job.matchFactors && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm text-foreground mb-2">Match Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-foreground">{job.matchFactors.skillsScore}%</div>
                      <div className="text-muted-foreground">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{job.matchFactors.experienceScore}%</div>
                      <div className="text-muted-foreground">Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{job.matchFactors.salaryScore}%</div>
                      <div className="text-muted-foreground">Salary</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{job.matchFactors.locationScore}%</div>
                      <div className="text-muted-foreground">Location</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{job.matchFactors.qualificationScore}%</div>
                      <div className="text-muted-foreground">Education</div>
                    </div>
                  </div>
                </div>
              )}

              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">{job.salaryRange}</span>
                </div>
                <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </JobCard>
        ))}
      </div>
    </div>
  );
};