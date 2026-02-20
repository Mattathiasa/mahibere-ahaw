import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Phone, MapPin, Download, Filter, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useQuery } from '@tanstack/react-query';
import { memberService } from '@/services/members';
import { toast } from 'sonner';

const Members = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterHierarchy, setFilterHierarchy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const permissions = useRolePermissions();

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => memberService.getAllMembers(),
  });

  const members = membersData?.users || [];

  // All possible hierarchy levels in order
  const hierarchyLevels = [
    'Sinodos',
    'KuamiSinodos', 
    'Memriya',
    'Zone',
    'Atbiya',
    'EnkesekaseMaikel',
    'HiyawanMahderat'
  ];

  // Filter members
  const filteredMembers = members.filter((member: any) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone && member.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      member.hierarchyLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.address?.region && member.address.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.address?.zone && member.address.zone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGender = filterGender === 'all' || member.gender === filterGender;
    const matchesHierarchy = filterHierarchy === 'all' || member.hierarchyLevel === filterHierarchy;

    return matchesSearch && matchesGender && matchesHierarchy;
  });

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'name':
        return a.fullName.localeCompare(b.fullName);
      case 'hierarchy':
        const hierarchyOrder = ['Sinodos', 'KuamiSinodos', 'Memriya', 'Zone', 'Atbiya', 'EnkesekaseMaikel', 'HiyawanMahderat'];
        return hierarchyOrder.indexOf(a.hierarchyLevel) - hierarchyOrder.indexOf(b.hierarchyLevel);
      case 'region':
        return (a.address?.region || '').localeCompare(b.address?.region || '');
      case 'zone':
        return (a.address?.zone || '').localeCompare(b.address?.zone || '');
      default:
        return 0;
    }
  });

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">
            View and manage church members ({sortedMembers.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          {permissions.canExportData && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, phone, role, region, or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="hierarchy">Sort by Hierarchy</SelectItem>
              <SelectItem value="region">Sort by Region</SelectItem>
              <SelectItem value="zone">Sort by Zone</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterGender} onValueChange={setFilterGender}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterHierarchy} onValueChange={setFilterHierarchy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Hierarchy Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {hierarchyLevels.map((level: any) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : sortedMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMembers.map((member: any) => {
            const initials = member.fullName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase();

            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                      {member.profilePicture && <AvatarImage src={member.profilePicture} alt={member.fullName} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{member.fullName}</CardTitle>
                      {member.fullNameAmharic && (
                        <p className="text-sm text-muted-foreground truncate">{member.fullNameAmharic}</p>
                      )}
                      <Badge variant="outline" className="mt-1">
                        {member.hierarchyLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">

                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {member.address.woreda && `${member.address.woreda}, `}
                        {member.address.zone && `${member.address.zone}, `}
                        {member.address.region}
                      </span>
                    </div>
                  )}
                  {member.ministryType && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Ministry:</p>
                      <Badge variant="secondary" className="text-xs">
                        {member.ministryType}
                      </Badge>
                    </div>
                  )}
                  {member.gender && (
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        {member.gender}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try adjusting your search or filters to find members."
        />
      )}
    </div>
  );
};

export default Members;
