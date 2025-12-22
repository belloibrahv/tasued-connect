"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Upload
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface ProfileSection {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
  icon: JSX.Element;
  description: string;
}

export function ProfileCompletenessTracker() {
  const [completeness, setCompleteness] = useState<number>(0);
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile data
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setUser(profileData);

      // Calculate profile completeness
      const sections: ProfileSection[] = [
        {
          id: "personal",
          title: "Personal Information",
          required: true,
          completed: !!(profileData?.first_name && profileData?.last_name && profileData?.phone),
          icon: <User className="w-4 h-4" />,
          description: "Name, phone number, and other personal details"
        },
        {
          id: "identification",
          title: "Identification",
          required: true,
          completed: !!(profileData?.matric_number || profileData?.staff_id),
          icon: <GraduationCap className="w-4 h-4" />,
          description: "Matriculation number or staff ID"
        },
        {
          id: "contact",
          title: "Contact Details",
          required: true,
          completed: !!(profileData?.email && profileData?.address),
          icon: <Mail className="w-4 h-4" />,
          description: "Email and physical address"
        },
        {
          id: "photo",
          title: "Profile Photo",
          required: true,
          completed: !!(profileData?.avatar_url),
          icon: <Camera className="w-4 h-4" />,
          description: "Official passport photo"
        },
        {
          id: "documents",
          title: "Supporting Documents",
          required: true,
          completed: !!(profileData?.document_status === 'verified'),
          icon: <FileText className="w-4 h-4" />,
          description: "Verified supporting documents"
        }
      ];

      setProfileSections(sections);

      // Calculate completeness percentage
      const completedCount = sections.filter(section => section.completed).length;
      const totalCount = sections.length;
      const percentage = Math.round((completedCount / totalCount) * 100);
      setCompleteness(percentage);
    }

    loadUserData();
  }, [supabase]);

  const handleUploadDocument = async () => {
    // Simulate document upload
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Uploading document...',
        success: 'Document uploaded successfully!',
        error: 'Failed to upload document'
      }
    );
  };

  const handleEditSection = (sectionId: string) => {
    // Navigate to specific section for editing
    toast.success(`Redirecting to ${sectionId} section`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Your Profile Status</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {completeness}% Complete
          </Badge>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Progress value={completeness} className="w-full" />
          <span className="text-sm font-medium min-w-[40px]">{completeness}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {profileSections.map((section) => (
            <div
              key={section.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors gap-3 sm:gap-0"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-full ${
                  section.completed
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}>
                  {section.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium truncate">{section.title}</h4>
                    {!section.required && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!section.completed && section.id === 'documents' && (
                  <Button size="sm" variant="outline" onClick={handleUploadDocument}>
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditSection(section.id)}
                >
                  {section.completed ? "View" : "Complete"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {completeness < 100 && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Incomplete Profile</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your profile is not yet complete. Please fill in the missing information to get full access to services.
                </p>
              </div>
            </div>
          </div>
        )}

        {completeness >= 80 && completeness < 100 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">Almost Done!</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Just a few more details to complete your profile.
                </p>
              </div>
            </div>
          </div>
        )}

        {completeness === 100 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Profile Complete!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your profile is fully complete and verified. Great job!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}