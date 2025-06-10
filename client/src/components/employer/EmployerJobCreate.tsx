import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Briefcase, Plus, Minus } from "lucide-react";

const jobPostSchema = z.object({
  title: z.string().min(1, "Role name is required"),
  minQualification: z.string().min(1, "Qualification is required"),
  skills: z.string().min(1, "Skill requirements are required"),
  responsibilities: z.string().min(1, "Responsibilities are required"),
  vacancy: z.number().min(1, "Number of positions must be at least 1"),
  experienceRequired: z.string().min(1, "Experience requirement is required"),
  salaryRange: z.string().min(1, "Salary range is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Job description is required"),
});

type JobPostFormData = z.infer<typeof jobPostSchema>;

export const EmployerJobCreate: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [skillsList, setSkillsList] = useState<string[]>([""]);
  const [responsibilitiesList, setResponsibilitiesList] = useState<string[]>([""]);

  // Check for clone data and referrer in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const cloneData = urlParams.get('clone');
  const referrer = urlParams.get('from') || 'dashboard';
  
  let defaultValues: Partial<JobPostFormData> = {
    vacancy: 1,
  };

  if (cloneData) {
    try {
      const parsedCloneData = JSON.parse(decodeURIComponent(cloneData));
      defaultValues = {
        ...parsedCloneData,
        vacancy: parsedCloneData.vacancy || 1,
      };
    } catch (error) {
      console.warn('Failed to parse clone data:', error);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<JobPostFormData>({
    resolver: zodResolver(jobPostSchema),
    defaultValues,
  });

  // Initialize form with clone data if present
  useEffect(() => {
    if (cloneData) {
      try {
        const parsedCloneData = JSON.parse(decodeURIComponent(cloneData));
        
        // Set skills list if present
        if (parsedCloneData.skills) {
          const skillsArray = parsedCloneData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
          setSkillsList(skillsArray.length > 0 ? skillsArray : [""]);
        }
        
        // Set responsibilities list if present
        if (parsedCloneData.responsibilities) {
          const responsibilitiesArray = parsedCloneData.responsibilities.split('\n').filter(Boolean);
          setResponsibilitiesList(responsibilitiesArray.length > 0 ? responsibilitiesArray : [""]);
        }
        
        // Clear URL parameters after loading
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.warn('Failed to initialize clone data:', error);
      }
    }
  }, [cloneData]);

  const createJobMutation = useMutation({
    mutationFn: async (jobData: JobPostFormData) => {
      const response = await apiRequest("/api/employers/jobs", "POST", jobData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job post created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employers/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employers/recent-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employers/stats"] });
      
      // Navigate back to the referring page
      const targetPage = referrer === 'jobs' ? '/jobs' : '/employer/dashboard';
      setLocation(targetPage);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job post",
        variant: "destructive",
      });
    },
  });

  const addSkill = () => {
    setSkillsList([...skillsList, ""]);
  };

  const removeSkill = (index: number) => {
    if (skillsList.length > 1) {
      const newSkills = skillsList.filter((_, i) => i !== index);
      setSkillsList(newSkills);
      setValue("skills", newSkills.filter(skill => skill.trim()).join(", "));
    }
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skillsList];
    newSkills[index] = value;
    setSkillsList(newSkills);
    setValue("skills", newSkills.filter(skill => skill.trim()).join(", "));
  };

  const addResponsibility = () => {
    setResponsibilitiesList([...responsibilitiesList, ""]);
  };

  const removeResponsibility = (index: number) => {
    if (responsibilitiesList.length > 1) {
      const newResponsibilities = responsibilitiesList.filter((_, i) => i !== index);
      setResponsibilitiesList(newResponsibilities);
      setValue("responsibilities", newResponsibilities.filter(resp => resp.trim()).join("\n• "));
    }
  };

  const updateResponsibility = (index: number, value: string) => {
    const newResponsibilities = [...responsibilitiesList];
    newResponsibilities[index] = value;
    setResponsibilitiesList(newResponsibilities);
    setValue("responsibilities", newResponsibilities.filter(resp => resp.trim()).map(resp => `• ${resp}`).join("\n"));
  };

  const onSubmit = (data: JobPostFormData) => {
    try {
      createJobMutation.mutate(data);
    } catch (error) {
      console.error("Error submitting job:", error);
      toast({
        title: "Error",
        description: "Failed to submit job post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const targetPage = referrer === 'jobs' ? '/jobs' : '/employer/dashboard';
            setLocation(targetPage);
          }}
          className="border-border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {referrer === 'jobs' ? 'Jobs' : 'Dashboard'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Job Post</h1>
          <p className="text-muted-foreground">Fill in the details to post a new job opening</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Briefcase className="h-5 w-5 mr-2 text-primary" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Role Name *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="e.g. Senior Software Engineer"
                  className="border-border"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vacancy">Number of Positions *</Label>
                <Input
                  id="vacancy"
                  type="number"
                  min="1"
                  {...register("vacancy", { valueAsNumber: true })}
                  placeholder="1"
                  className="border-border"
                />
                {errors.vacancy && (
                  <p className="text-sm text-destructive">{errors.vacancy.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="e.g. New York, NY"
                  className="border-border"
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range *</Label>
                <Input
                  id="salaryRange"
                  {...register("salaryRange")}
                  placeholder="e.g. ₹8,00,000 - ₹12,00,000"
                  className="border-border"
                />
                {errors.salaryRange && (
                  <p className="text-sm text-destructive">{errors.salaryRange.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Provide a detailed description of the role..."
                rows={4}
                className="border-border"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minQualification">Qualification *</Label>
              <Select
                value={watch("minQualification")}
                onValueChange={(value) => setValue("minQualification", value)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select minimum qualification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                  <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                  <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="Professional Certification">Professional Certification</SelectItem>
                </SelectContent>
              </Select>
              {errors.minQualification && (
                <p className="text-sm text-destructive">{errors.minQualification.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceRequired">Experience Required *</Label>
              <Select
                value={watch("experienceRequired")}
                onValueChange={(value) => setValue("experienceRequired", value)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry Level (0-1 years)">Entry Level (0-1 years)</SelectItem>
                  <SelectItem value="Junior (1-3 years)">Junior (1-3 years)</SelectItem>
                  <SelectItem value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</SelectItem>
                  <SelectItem value="Senior (5-8 years)">Senior (5-8 years)</SelectItem>
                  <SelectItem value="Lead (8+ years)">Lead (8+ years)</SelectItem>
                  <SelectItem value="Executive (10+ years)">Executive (10+ years)</SelectItem>
                </SelectContent>
              </Select>
              {errors.experienceRequired && (
                <p className="text-sm text-destructive">{errors.experienceRequired.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Skill Requirements *</Label>
              {skillsList.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={skill}
                    onChange={(e) => updateSkill(index, e.target.value)}
                    placeholder="e.g. React, Node.js, TypeScript"
                    className="border-border flex-1"
                  />
                  {skillsList.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSkill(index)}
                      className="border-border hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkill}
                className="border-border hover:bg-accent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
              {errors.skills && (
                <p className="text-sm text-destructive">{errors.skills.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Responsibilities *</Label>
              {responsibilitiesList.map((responsibility, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    placeholder="e.g. Develop and maintain web applications"
                    className="border-border flex-1"
                  />
                  {responsibilitiesList.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeResponsibility(index)}
                      className="border-border hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResponsibility}
                className="border-border hover:bg-accent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Responsibility
              </Button>
              {errors.responsibilities && (
                <p className="text-sm text-destructive">{errors.responsibilities.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const targetPage = referrer === 'jobs' ? '/jobs' : '/employer/dashboard';
              setLocation(targetPage);
            }}
            className="border-border hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createJobMutation.isPending}
            className="bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {isSubmitting || createJobMutation.isPending ? "Creating..." : "Create Job Post"}
          </Button>
        </div>
      </form>
    </div>
  );
};