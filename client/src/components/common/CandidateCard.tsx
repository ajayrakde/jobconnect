import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";

interface CandidateCardProps {
  candidate: any;
  children?: React.ReactNode;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, children }) => (
  <Card className="border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
    <div className="p-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={candidate.avatar}
            alt={
              typeof candidate.name === "object"
                ? `${candidate.name.first || ""} ${candidate.name.last || ""}`
                : candidate.name || "Candidate"
            }
          />
          <AvatarFallback>
            {typeof candidate.name === "object"
              ? `${candidate.name.first?.[0] || ""}${candidate.name.last?.[0] || ""}`
              : candidate.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {typeof candidate.name === "object"
              ? `${candidate.name.first || ""} ${candidate.name.last || ""}`
              : candidate.name || "Candidate"}
          </h3>
          <p className="text-sm text-gray-600">
            {typeof candidate.role === "object" ? candidate.role.title || "Professional" : candidate.role || "Professional"}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {typeof candidate.experience === "object" ? `${candidate.experience.years || 0} years` : `${candidate.experience || 0} years`}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {typeof candidate.location === "object" ? candidate.location.city || "Location" : candidate.location || "Location"}
            </Badge>
          </div>
        </div>
        {children}
      </div>
    </div>
  </Card>
);

