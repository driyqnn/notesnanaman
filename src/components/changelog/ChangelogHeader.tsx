import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChangelogHeaderProps {
  searchQuery: string;
  filterType: 'all' | 'documents' | 'images' | 'spreadsheets' | 'presentations';
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'all' | 'documents' | 'images' | 'spreadsheets' | 'presentations') => void;
  onClearFilters: () => void;
}

export const ChangelogHeader: React.FC<ChangelogHeaderProps> = ({
  searchQuery,
  filterType,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Changelog</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2"
        >
          <span>Back to Drive</span>
        </Button>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={onFilterChange}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
                  <SelectItem value="presentations">Presentations</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || filterType !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};