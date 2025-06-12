import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Search, SortAsc, MoreVertical, Eye, Edit, Trash2, CheckCircle, User, Building2, FileText, FlaskConical, Users, Briefcase, MapPin, Calendar } from "lucide-react";

// Placeholder data fetchers (replace with real API hooks)
const useAdminSearch = (type, query, filters, sort) => {
  // Return mock data for now
  return { data: [], isLoading: false };
};

export const AdminSearchPanel: React.FC = () => {
  const [type, setType] = useState("candidate"); // Changed default to "candidate" instead of "all"
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("latest");
  const [filters, setFilters] = useState({});

  const { data: results, isLoading } = useAdminSearch(type, search, filters, sort);

  // Filter definitions per type
  const filterOptions = {
    candidate: [
      { key: "qualification", label: "Qualification" },
      { key: "experience", label: "Experience Level" },
      { key: "city", label: "City" },
      { key: "status", label: "Status" },
    ],
    employer: [
      { key: "industry", label: "Industry" },
      { key: "size", label: "Business Size" },
      { key: "city", label: "City" },
      { key: "status", label: "Status" },
    ],
    job: [
      { key: "category", label: "Category" },
      { key: "experience", label: "Experience Required" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
  };

  // Card renderers
  const renderCard = (item) => {
    if (item.type === "candidate") {
      return (
        <Card key={item.id} className="bg-card border-border">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{item.name}</span>
                <Badge variant={item.status === "verified" ? "success" : "secondary"}>{item.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.qualification} • {item.experience} • {item.city}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Verify</DropdownMenuItem>
                  <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                  <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View As</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      );
    }
    if (item.type === "employer") {
      return (
        <Card key={item.id} className="bg-card border-border">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{item.companyName}</span>
                <Badge variant={item.status === "verified" ? "success" : "secondary"}>{item.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.industry} • {item.size} • {item.city}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Verify</DropdownMenuItem>
                  <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                  <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View As</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      );
    }
    if (item.type === "job") {
      return (
        <Card key={item.id} className="bg-card border-border">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{item.title}</span>
                <Badge variant={item.status === "active" ? "success" : item.status === "flagged" ? "destructive" : "secondary"}>{item.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.employer} • {item.city} • Posted {item.postedOn}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                  <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                  <DropdownMenuItem><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                  <DropdownMenuItem><FlaskConical className="h-4 w-4 mr-2" />Run Compatibility</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      );
    }
    // Fallback for mixed/all
    return null;
  };

  // Mixed list for "all"
  const renderMixedCard = (item) => {
    let icon = <User className="h-5 w-5 text-primary" />;
    let label = "Candidate";
    if (item.type === "employer") {
      icon = <Building2 className="h-5 w-5 text-primary" />;
      label = "Employer";
    } else if (item.type === "job") {
      icon = <FileText className="h-5 w-5 text-primary" />;
      label = "Job Post";
    }
    return (
      <Card key={item.id} className="bg-card border-border">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <span className="font-semibold text-foreground">{item.name || item.companyName || item.title}</span>
              <Badge variant="outline">{label}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {/* Show summary info based on type */}
              {item.type === "candidate" && `${item.qualification} • ${item.experience} • ${item.city}`}
              {item.type === "employer" && `${item.industry} • ${item.size} • ${item.city}`}
              {item.type === "job" && `${item.employer} • ${item.city} • Posted ${item.postedOn}`}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Show actions based on type */}
                {item.type === "candidate" && <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Verify</DropdownMenuItem>}
                {item.type === "employer" && <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Verify</DropdownMenuItem>}
                {item.type === "job" && <DropdownMenuItem><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>}
                <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View As</DropdownMenuItem>
                {item.type === "job" && <DropdownMenuItem><FlaskConical className="h-4 w-4 mr-2" />Run Compatibility</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Tabs value={type} onValueChange={setType} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="candidate">Candidates</TabsTrigger>
            <TabsTrigger value="employer">Employers</TabsTrigger>
            <TabsTrigger value="job">Job Posts</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10 bg-background border-border"
            placeholder="Search by name, email, company, job title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(v => !v)}>
          <Filter className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSort("latest")}>Latest</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("name")}>Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort("relevance")}>Relevance</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Context-Specific Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border border-border">
          {filterOptions[type].map(opt => (
            <div key={opt.key} className="flex flex-col">
              <label className="text-xs font-medium mb-1">{opt.label}</label>
              <Input
                className="bg-background border-border"
                placeholder={opt.label}
                value={filters[opt.key] || ""}
                onChange={e => setFilters(f => ({ ...f, [opt.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : results.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No results found.</div>
        ) : (
          results.map(renderCard)
        )}
      </div>
    </div>
  );
};
