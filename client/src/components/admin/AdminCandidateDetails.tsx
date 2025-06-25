import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Briefcase } from "lucide-react";

export const AdminCandidateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: candidate, isLoading } = useQuery({
    queryKey: [`/api/admin/candidates/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="animate-pulse bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">
              Candidate not found
            </h3>
            <Link href="/admin/tools">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Candidate Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>{" "}
              <span className="font-medium">{candidate.dateOfBirth || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span>{" "}
              <span className="font-medium capitalize">
                {candidate.gender || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Marital Status:</span>{" "}
              <span className="font-medium capitalize">
                {candidate.maritalStatus || "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Dependents:</span>{" "}
              <span className="font-medium">{candidate.dependents ?? "-"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Address:</span>{" "}
              <span className="font-medium">{candidate.address || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Expected Salary:</span>{" "}
              <span className="font-medium">
                {candidate.expectedSalary ? `$${candidate.expectedSalary}` : "-"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Languages:</span>{" "}
              <span className="font-medium">
                {Array.isArray(candidate.languages)
                  ? candidate.languages.join(", ")
                  : "-"}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Skills:</span>{" "}
              <span className="font-medium">
                {Array.isArray(candidate.skills)
                  ? candidate.skills.join(", ")
                  : "-"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {candidate.documents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(candidate.documents).map(([key, value]) => {
              try {
                const doc = JSON.parse(value as unknown as string);
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{key}:</span>
                    {doc?.data ? (
                      <a
                        href={doc.data}
                        download={doc.name || `${key}.pdf`}
                        className="text-primary hover:underline"
                      >
                        Download {doc.name || key}
                      </a>
                    ) : (
                      <span className="font-medium">{doc?.name || 'N/A'}</span>
                    )}
                  </div>
                );
              } catch {
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{key}:</span>
                    <span className="font-medium">{value as string}</span>
                  </div>
                );
              }
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
