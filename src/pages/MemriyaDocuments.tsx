import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, FolderOpen, FileText, Download, Trash2, Search, ChevronRight, FolderPlus, ArrowLeft, Upload, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService, Document } from '@/services/documents';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { LearnMore } from '@/components/LearnMore';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/utils';

const MemriyaDocuments = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const moduleCfg = useModuleConfig('documents');
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // For breadcrumbs, we need to fetch all folders or traverse up. 
    // Simplified: fetch all documents once or store breadcrumb state.
    // Better: Helper query to get parent details or just store breadcrumb path in local state if we traverse down.
    // For now, let's store breadcrumb history in local state
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Home' }]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch documents
    const { data: documentsData, isLoading } = useQuery({
        queryKey: ['documents', currentFolderId],
        queryFn: () => documentService.getDocuments(currentFolderId),
    });

    const documents = documentsData?.documents || [];

    // Create Folder Mutation
    const createFolderMutation = useMutation({
        mutationFn: (name: string) => documentService.createFolder(name, currentFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', currentFolderId] });
            setIsCreateFolderOpen(false);
            setNewFolderName('');
            toast.success('Folder created successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to create folder');
        }
    });

    // Upload File Mutation
    const uploadFileMutation = useMutation({
        mutationFn: (file: File) => documentService.uploadFile(file, currentFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', currentFolderId] });
            toast.success('File uploaded successfully');
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: () => {
            toast.error('Failed to upload file');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentService.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', currentFolderId] });
            toast.success('Item deleted');
        }
    });

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        createFolderMutation.mutate(newFolderName);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Upload each file
            Array.from(e.target.files).forEach(file => {
                uploadFileMutation.mutate(file);
            });
        }
    };

    const handleNavigate = (folder: Document) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        setSearchQuery('');
    };

    const handleNavigateUp = (index: number) => {
        const newCrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newCrumbs);
        setCurrentFolderId(newCrumbs[newCrumbs.length - 1].id);
        setSearchQuery('');
    };

    // Filter items locally for search
    const filteredItems = searchQuery
        ? documents.filter((item: Document) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : documents;

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <FolderOpen className="h-8 w-8 text-primary" />
                        {moduleCfg.headerTitle || 'Memriya Documents'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {moduleCfg.headerDescription || `Manage files and folders for ${user?.hierarchyLevel === 'Memriya' ? 'your Memriya' : 'the Memriya'}.`}
                    </p>
                    <LearnMore title={moduleCfg.headerTitle || 'Memriya Documents'} content={moduleCfg.learnMore} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Add Content</CardTitle>
                        <CardDescription>Upload files or create folders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <FolderPlus className="h-4 w-4" />
                                    Create New Folder
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Folder</DialogTitle>
                                    <DialogDescription>
                                        Enter a name for the new folder.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 py-2">
                                    <Label htmlFor="folder-name">Folder Name</Label>
                                    <Input
                                        id="folder-name"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="e.g. Reports 2024"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolderMutation.isPending}>
                                        {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Upload Files</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button
                                className="w-full justify-start gap-2 h-24 border-dashed"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadFileMutation.isPending}
                            >
                                {uploadFileMutation.isPending ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Upload className="h-6 w-6" />
                                )}
                                <div className="flex flex-col items-start">
                                    <span>Click to upload files</span>
                                    <span className="text-xs font-normal text-muted-foreground">Any file type supported</span>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* File List Section */}
                <Card className="lg:col-span-2 min-h-[500px]">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
                                {breadcrumbs.map((crumb, index) => (
                                    <div key={crumb.id || 'root'} className="flex items-center">
                                        {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                                        <button
                                            onClick={() => handleNavigateUp(index)}
                                            className={`hover:text-primary transition-colors ${index === breadcrumbs.length - 1 ? 'font-semibold text-foreground' : ''}`}
                                        >
                                            {crumb.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full md:w-1/2 relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search documents..."
                                    className="pl-9 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {breadcrumbs.length > 1 && !searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mb-2 -ml-2 text-muted-foreground"
                                onClick={() => handleNavigateUp(breadcrumbs.length - 2)}
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back
                            </Button>
                        )}

                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                                Loading...
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <div className="space-y-1">
                                {filteredItems.map((item: Document) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            if (item.type === 'folder') {
                                                handleNavigate(item);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {item.type === 'folder' ? (
                                                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center flex-shrink-0">
                                                    <Folder className="h-5 w-5 fill-current" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <p className="font-medium truncate text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    {item.size && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{item.size}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.type === 'file' && item.filePath && (
                                                <a
                                                    href={`http://localhost:5000/${item.filePath.replace(/\\/g, '/')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title="Delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteMutation.mutate(item.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                {searchQuery ? <p>No results found for "{searchQuery}"</p> : <p>This folder is empty</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MemriyaDocuments;

