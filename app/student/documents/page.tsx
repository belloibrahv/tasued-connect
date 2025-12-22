"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Download,
  AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_at: string;
  status: 'pending' | 'verified' | 'rejected';
  description: string;
}

export default function StudentDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUser(user);

        // Mock document data for now - in real app this would come from Supabase
        const mockDocuments: Document[] = [
          {
            id: "1",
            name: "Transcript.pdf",
            type: "Transcript",
            size: "2.3 MB",
            uploaded_at: "2024-12-15",
            status: "verified",
            description: "Official academic transcript from previous institution"
          },
          {
            id: "2",
            name: "ID_Card.jpg",
            type: "Identification",
            size: "1.1 MB",
            uploaded_at: "2024-12-10",
            status: "verified",
            description: "Government-issued identification card"
          },
          {
            id: "3",
            name: "Passport_Photo.jpg",
            type: "Passport Photo",
            size: "0.8 MB",
            uploaded_at: "2024-12-05",
            status: "pending",
            description: "Recent passport-size photograph"
          }
        ];

        setDocuments(mockDocuments);
      } catch (error) {
        console.error("Error loading documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [supabase]);

  const handleUpload = () => {
    toast.success("Document upload would start here");
  };

  const handleView = (id: string) => {
    toast.success(`Viewing document: ${id}`);
  };

  const handleDownload = (id: string) => {
    toast.success(`Downloading document: ${id}`);
  };

  const pendingCount = documents.filter(doc => doc.status === 'pending').length;
  const verifiedCount = documents.filter(doc => doc.status === 'verified').length;
  const rejectedCount = documents.filter(doc => doc.status === 'rejected').length;

  const verificationProgress = Math.round((verifiedCount / documents.length) * 100) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Verification</h1>
        <p className="text-muted-foreground">Upload and manage your academic and identification documents.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{verificationProgress}%</span>
              </div>
              <Progress value={verificationProgress} className="h-2" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold">{verifiedCount}</p>
                  <p className="text-xs text-green-600">Verified</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-yellow-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                  <p className="text-xs text-destructive">Rejected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Admission Letter</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Birth Certificate</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>WAEC/NECO Result</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Passport Photograph</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Medical Certificate</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upload Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground mb-4">Supports PDF, JPG, PNG up to 5MB</p>
              <Button onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Document</th>
                  <th className="text-left py-3">Type</th>
                  <th className="text-left py-3">Uploaded</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline">{doc.type}</Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {doc.uploaded_at}
                    </td>
                    <td className="py-3">
                      {doc.status === 'verified' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : doc.status === 'pending' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/20">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(doc.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {documents.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">No documents uploaded</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven&apos;t uploaded any documents yet.
              </p>
              <Button onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}