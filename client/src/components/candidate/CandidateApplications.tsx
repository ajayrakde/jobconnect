import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building, Clock, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Application {
  id: number;
  jobPostId: number;
  status: string;
  appliedAt: string;
  jobTitle: string;
  company: string;
  location: string;
  salaryRange: string;
  jobCode: string;
}

export const CandidateApplications: React.FC = () => {
  const { userProfile } = useAuth();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/candidates/applications"],
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
              <div className="h-6 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!Array.isArray(applications) || applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You haven't applied to any jobs yet. Browse available positions and start applying to find your next opportunity.
        </p>
        <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
          Browse Jobs
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'reviewed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'shortlisted':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications
          </p>
        </div>
        <Badge variant="outline" className="text-sm border-border">
          {Array.isArray(applications) ? applications.length : 0} application{Array.isArray(applications) && applications.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {Array.isArray(applications) && applications.map((application: Application) => (
          <Card key={application.id} className="bg-card border-border hover:bg-accent/50 dark:hover:bg-accent/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl text-foreground">{application.jobTitle}</CardTitle>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {application.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {application.location || "Location not specified"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="ml-4 border-border">
                  {application.jobCode}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div className="text-green-600 dark:text-green-400 font-medium">
                  {application.salaryRange || "Salary not disclosed"}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="border-border hover:bg-accent text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    Withdraw
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};