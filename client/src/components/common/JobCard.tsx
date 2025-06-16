import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign } from "lucide-react";

interface JobCardProps {
  job: any;
  children?: React.ReactNode;
}

export const JobCard: React.FC<JobCardProps> = ({ job, children }) => (
  <Card className="border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
    <div className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.company?.name || "Company Name"}</p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {job.location?.city || job.location || "Location"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              {job.salaryRange || "Salary range"}
            </Badge>
          </div>
        </div>
        {children}
      </div>
    </div>
  </Card>
);

