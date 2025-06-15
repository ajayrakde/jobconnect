import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Search, SortAsc, MoreVertical, Eye, Edit, Trash2, CheckCircle, User, Building2, FileText, FlaskConical, Users, Briefcase, MapPin, Calendar } from "lucide-react";
import { experienceLevels } from "@shared/constants";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { debugLog } from "@/lib/logger";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";

interface SearchFilters {
  qualification?: string;
  experience?: string;
  city?: string;
  status?: string;
  industry?: string;
  size?: string;
  category?: string;
  location?: string;
}

interface Candidate {
  id: number;
  type: 'candidate';
  name: string;
  email: string;
  qualification: string;
  experience: string | { years: number };
  city: string;
  status: 'verified' | 'pending' | 'rejected';
  avatar?: string;
}

interface Employer {
  id: number;
  type: 'employer';
  companyName: string;
  industry: string;
  size: string;
  city: string;
  status: 'verified' | 'pending' | 'rejected';
  logo?: string;
}

interface JobPost {
  id: number;
  type: 'job';
  title: string;
  employer: string;
  employerId: number;
  city: string;
  status: 'active' | 'inactive' | 'flagged';
  postedOn: string;
  category: string;
  experienceRequired: string;
}

type SearchResult = Candidate | Employer | JobPost;

// Enhanced search hook with proper typing
const useAdminSearch = (type: string, query: string, filters: SearchFilters, sort: string) => {
  return useQuery({
    queryKey: ['/api/admin/search', type, query, filters, sort],
    queryFn: async () => {
      try {
        // Skip if no meaningful search criteria
        if (!query && Object.values(filters).every(v => !v)) {
          return [];
        }

        const params = new URLSearchParams({
          type,
          q: query,
          sort,
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v != null && v !== '')
          )
        });
        
        const response = await apiRequest(`/api/admin/search?${params}`, 'GET');
        const data = await response.json();
        
        // Log the response for debugging
        debugLog('Search response:', data);
        
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Search failed');
        }

        // Extract results from the response
        const results = data.success ? data.data : data;
        return Array.isArray(results) ? results : [];
        
      } catch (error) {
        console.error('Search error:', error);
        throw error instanceof Error ? error : new Error('Search failed');
      }
    },
    enabled: query.length >= 2 || Object.keys(filters).length > 0,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
};

export const AdminSearchPanel: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  React.useEffect(() => {
    if (!user || userProfile?.role !== "admin") {
      setLocation("/admin");
    }
  }, [user, userProfile, setLocation]);

  const [type, setType] = useState<'candidate' | 'employer' | 'job'>('candidate');
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<'latest' | 'name' | 'relevance'>('latest');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results = [], isLoading, isError, error } = useAdminSearch(
    type,
    debouncedSearch,
    filters,
    sort
  );

  // Filter definitions per type with predefined options
  const filterOptions = {
    candidate: [
      { 
        key: "qualification",
        label: "Qualification",
        options: ["Bachelor's", "Master's", "PhD", "High School", "Other"]
      },
      { 
        key: "experience",
        label: "Experience Level",
        options: ["0-2 years", "3-5 years", "5-10 years", "10+ years"]
      },
      { 
        key: "status",
        label: "Verification Status",
        options: ["verified", "pending", "rejected"]
      },
    ],
    employer: [
      { 
        key: "industry",
        label: "Industry",
        options: ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Other"]
      },
      { 
        key: "size",
        label: "Business Size",
        options: ["1-10", "11-50", "51-200", "201-1000", "1000+"]
      },
      { 
        key: "status",
        label: "Verification Status",
        options: ["verified", "pending", "rejected"]
      },
    ],
    job: [
      { 
        key: "category",
        label: "Category",
        options: ["Engineering", "Design", "Marketing", "Sales", "Management", "Other"]
      },
      {
        key: "experience",
        label: "Experience Required",
        options: experienceLevels
      },
      { 
        key: "status",
        label: "Status",
        options: ["active", "inactive", "flagged"]
      },
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
            <div key={opt.key} className="flex flex-col min-w-[200px]">
              <label className="text-xs font-medium mb-1">{opt.label}</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    {filters[opt.key] || `Select ${opt.label}`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  {opt.options.map(value => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setFilters(f => ({ ...f, [opt.key]: value }))}
                    >
                      {value}
                    </DropdownMenuItem>
                  ))}
                  {filters[opt.key] && (
                    <DropdownMenuItem
                      onClick={() => setFilters(f => {
                        const newFilters = { ...f };
                        delete newFilters[opt.key];
                        return newFilters;
                      })}
                      className="text-destructive"
                    >
                      Clear
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {Object.keys(filters).length > 0 && (
            <Button
              variant="outline"
              className="self-end"
              onClick={() => setFilters({})}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <div className="mt-4 text-muted-foreground">Loading results...</div>
          </div>
        ) : isError ? (
          <div className="text-center text-destructive py-12">
            <div className="mb-2">Error loading results</div>
            <div className="text-sm text-muted-foreground">
              {error instanceof Error 
                ? error.message.includes('<!DOCTYPE') 
                  ? 'Server error occurred. Please try again.' 
                  : error.message
                : 'Please try again'}
            </div>
            {process.env.NODE_ENV === 'development' && error instanceof Error && (
              <pre className="mt-4 text-xs text-left bg-muted/30 p-4 rounded overflow-auto">
                {error.message}
              </pre>
            )}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {search || Object.keys(filters).length > 0 ? (
              <>
                <div className="mb-2">No results found</div>
                <div className="text-sm">Try adjusting your search or filters</div>
              </>
            ) : (
              <>
                <div className="mb-2">Start searching</div>
                <div className="text-sm">Use the search bar or filters above to find {type}s</div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                Found {results.length} {type}{results.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-muted-foreground">
                Showing verified {type}s only
              </div>
            </div>
            <div className="space-y-4">
              {results.map(renderCard)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
