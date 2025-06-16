import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Briefcase } from "lucide-react";
import { JobCard, CandidateCard } from "@/components/common";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MatchingModal } from "./MatchingModal";
import { Link } from "wouter";

export const MatchingEngine: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingType, setMatchingType] = useState<"job-candidates" | "candidate-jobs">("job-candidates");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  const { data: candidates } = useQuery({
    queryKey: ["/api/admin/active-candidates"],
  });

  const shortlistMutation = useMutation({
    mutationFn: (data: { jobPostId: number; candidateId: number; matchScore: number }) =>
      apiRequest("/api/admin/shortlist", "POST", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Candidate shortlisted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shortlists"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to shortlist candidate.",
        variant: "destructive",
      });
    },
  });


  const handleCandidateClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setMatchingType("candidate-jobs");
    setShowMatchingModal(true);
  };

  const handleShortlist = (jobId: number, candidateId: number, matchScore: number) => {
    shortlistMutation.mutate({
      jobPostId: jobId,
      candidateId: candidateId,
      matchScore: matchScore,
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Jobs with Matching Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
          <p className="text-sm text-gray-600">
            Click on a job to find matching candidates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs?.map((job: any) => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}>
                <JobCard job={job}>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {job.matchCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">matches</div>
                  </div>
                </JobCard>
              </Link>
            ))}

            {(!jobs || jobs.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active jobs found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidates with Job Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Top Active Candidates</CardTitle>
          <p className="text-sm text-gray-600">
            Click on a candidate to find matching jobs
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {candidates?.map((candidate: any, index: number) => (
              <Link
                key={candidate.id ?? candidate.candidate?.id ?? index}
                href={`/candidates/${candidate.id ?? candidate.candidate?.id ?? ''}`}
              >
                <CandidateCard candidate={candidate}>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {candidate.jobMatches || 0}
                    </div>
                    <div className="text-xs text-gray-500">job matches</div>
                  </div>
                </CandidateCard>
              </Link>
            ))}

            {(!candidates || candidates.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No candidates found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matching Modal */}
      <MatchingModal
        isOpen={showMatchingModal}
        onClose={() => setShowMatchingModal(false)}
        selectedJob={selectedJob}
        selectedCandidate={selectedCandidate}
        matchingType={matchingType}
        onShortlist={handleShortlist}
      />
    </div>
  );
};
