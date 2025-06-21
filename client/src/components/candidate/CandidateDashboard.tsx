import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, Calendar, Trophy, MapPin, DollarSign, Clock, Building } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { subDays, isAfter } from "date-fns";
import { Link } from "wouter";

export const CandidateDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/candidates/stats"],
  });

  const { data: allJobs = [] } = useQuery({
    queryKey: ["/api/candidates/jobs"],
    enabled: !!userProfile?.candidate,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["/api/candidates/applications"],
    enabled: !!userProfile?.candidate,
  });

  const appliedJobIds = new Set(
    Array.isArray(applications) ? applications.map((a: any) => a.jobPostId) : []
  );

  const candidateDegrees =
    userProfile?.candidate?.qualifications?.map((q: any) =>
      q.degree?.toLowerCase()
    ) || [];

  const recommendedJobs = Array.isArray(allJobs)
    ? allJobs
        .filter(
          (job: any) =>
            !appliedJobIds.has(job.id) &&
            (candidateDegrees.length === 0 ||
              candidateDegrees.some((d: string) =>
                job.minQualification?.toLowerCase().includes(d)
              )),
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
    : [];

  const recentApplications = Array.isArray(applications)
    ? applications.filter((app: any) =>
        isAfter(new Date(app.appliedAt), subDays(new Date(), 30))
      )
    : [];

  if (!userProfile) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {userProfile.name}!
          </h1>
          <p className="text-muted-foreground">
            Discover new opportunities and manage your job applications
          </p>
        </div>
        <Link href="/candidate/profile/edit">
          <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
            My Profile
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profile Views</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.profileViews || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.applications || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interviews</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.interviews || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Match Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.matchScore || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recommended Jobs</CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-curated opportunities based on your profile
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recommendedJobs.map((job: any) => (
              <div
                key={job.id}
                className="border border-border bg-card rounded-lg p-6 hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salaryRange}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.postedDate}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills?.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="bg-secondary text-secondary-foreground">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {job.matchScore}%
                      </span>
                      <span className="text-sm text-muted-foreground">match</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                        View Details
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground">Apply Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {recommendedJobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted" />
                <p>No recommended jobs yet. Complete your profile to get personalized recommendations.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApplications.map((app: any) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 border border-border bg-card rounded-lg hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{app.jobTitle}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      app.status === "interviewed"
                        ? "default"
                        : app.status === "shortlisted"
                        ? "secondary"
                        : "outline"
                    }
                    className="border-border"
                  >
                    {app.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{app.appliedAt}</p>
                </div>
              </div>
            ))}

            {recentApplications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-4 text-muted" />
                <p>No applications yet. Start applying to jobs!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
