'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  FolderOpen, 
  FileText, 
  Tag,
  Calendar,
  Users,
  Settings,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { DocumentGroup, Document } from '@/lib/types';
import { documentService } from '@/lib/services/document-service';
import { currentUser } from '@/lib/types';

interface DocumentGroupsManagerProps {
  onGroupSelect?: (groupId: string) => void;
  selectedGroupId?: string;
}

export default function DocumentGroupsManager({ onGroupSelect, selectedGroupId }: DocumentGroupsManagerProps) {
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [categorizedGroups, setCategorizedGroups] = useState<Record<string, DocumentGroup[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DocumentGroup | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    tags: [] as string[]
  });

  // Predefined categories
  const categories = [
    'general',
    'research',
    'analysis',
    'reports',
    'references',
    'datasets',
    'literature',
    'projects'
  ];

  // Predefined tags
  const suggestedTags = [
    'AI', 'Machine Learning', 'Research', 'Analysis', 'Report',
    'Dataset', 'Literature', 'Review', 'Case Study', 'Whitepaper'
  ];

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    categorizeGroups();
  }, [groups, searchTerm]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await documentService.getUserDocumentGroups(currentUser.id);
      setGroups(userGroups);
    } catch (error) {
      console.error('Failed to load document groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeGroups = () => {
    const filtered = groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const categorized: Record<string, DocumentGroup[]> = {};
    filtered.forEach(group => {
      const category = group.category || 'uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(group);
    });

    setCategorizedGroups(categorized);
  };

  const handleCreateGroup = async () => {
    try {
      setLoading(true);
      const newGroup = await documentService.createDocumentGroup(
        formData.name,
        currentUser.id,
        formData.description,
        undefined, // missionId
        formData.category,
        formData.tags
      );

      setGroups(prev => [newGroup, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      setLoading(true);
      const updatedGroup = await documentService.updateDocumentGroup(editingGroup.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags
      });

      setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      setEditingGroup(null);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to update group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will not delete the documents.')) {
      return;
    }

    try {
      setLoading(true);
      await documentService.deleteDocumentGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to delete group:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      tags: []
    });
  };

  const handleEditGroup = (group: DocumentGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      category: group.category || 'general',
      tags: group.tags || []
    });
    setIsCreateDialogOpen(true);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const GroupCard = ({ group }: { group: DocumentGroup }) => (
    <Card 
      className={`hover:shadow-md transition-all cursor-pointer ${
        selectedGroupId === group.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onGroupSelect?.(group.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
            {group.description && (
              <CardDescription className="text-sm line-clamp-2 mt-1">
                {group.description}
              </CardDescription>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              // Add dropdown menu here
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {group.category || 'general'}
          </Badge>
          {group.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {group.tags && group.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{group.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{group.documents?.length || 0} docs</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleEditGroup(group);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(group.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {group.documents && group.documents.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex -space-x-2">
              {group.documents.slice(0, 4).map(doc => (
                <div
                  key={doc.id}
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600"
                  title={doc.title}
                >
                  {doc.title.charAt(0).toUpperCase()}
                </div>
              ))}
              {group.documents.length > 4 && (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  +{group.documents.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Groups</h2>
          <p className="text-gray-600">Organize your documents into themed collections</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingGroup(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Edit Document Group' : 'Create Document Group'}
              </DialogTitle>
              <DialogDescription>
                {editingGroup 
                  ? 'Update the document group details'
                  : 'Create a new collection to organize your documents'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this group"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Selected: {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={!formData.name.trim() || loading}
              >
                {loading ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search groups by name, description, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Groups by Category */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading document groups...</p>
        </div>
      ) : Object.keys(categorizedGroups).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No document groups found</h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm ? 'No groups match your search.' : 'Create your first group to organize documents.'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(categorizedGroups).map(([category, categoryGroups]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {category}
                </h3>
                <Badge variant="secondary">{categoryGroups.length}</Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryGroups.map(group => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}