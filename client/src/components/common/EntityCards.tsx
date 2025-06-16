import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface EmployerInfo {
  organizationName: string;
  registrationNumber?: string;
  industry?: string;
  city?: string;
}

export const EmployerCard: React.FC<{
  employer: EmployerInfo;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ employer, actions, children }) => {
  const { organizationName, registrationNumber, industry, city } = employer;
  return (
    <Card className="bg-card border-border">
      <div className="flex items-start justify-between">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">
            {organizationName}
          </CardTitle>
          <CardDescription>
            {[registrationNumber, industry, city].filter(Boolean).join(" • ")}
          </CardDescription>
        </CardHeader>
        {actions && <div className="pr-4 pt-4">{actions}</div>}
      </div>
      {children && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
};

export interface CandidateInfo {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  qualification?: string;
  industry?: string;
  experience?: string;
  city?: string;
}

export const CandidateCard: React.FC<{
  candidate: CandidateInfo;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ candidate, actions, children }) => {
  const { firstName, lastName, fullName, qualification, industry, experience, city } = candidate;
  return (
    <Card className="bg-card border-border">
      <div className="flex items-start justify-between">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">
            {fullName || `${firstName ?? ""} ${lastName ?? ""}`.trim()}
          </CardTitle>
          <CardDescription>
            {[qualification, industry, experience, city]
              .filter(Boolean)
              .join(" • ")}
          </CardDescription>
        </CardHeader>
        {actions && <div className="pr-4 pt-4">{actions}</div>}
      </div>
      {children && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
};

export interface JobInfo {
  title: string;
  positions?: number | string;
  qualification?: string;
  experience?: string;
  city?: string;
  postedOn?: string;
}

export const JobCard: React.FC<{
  job: JobInfo;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ job, actions, children }) => {
  const { title, positions, qualification, experience, city, postedOn } = job;
  const details = [
    positions !== undefined ? `Positions: ${positions}` : undefined,
    qualification,
    experience,
    city,
    postedOn,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Card className="bg-card border-border">
      <div className="flex items-start justify-between">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>{details}</CardDescription>
        </CardHeader>
        {actions && <div className="pr-4 pt-4">{actions}</div>}
      </div>
      {children && <div className="px-4 pb-4">{children}</div>}
    </Card>
  );
};

