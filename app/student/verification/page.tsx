"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  UserCheck,
  GraduationCap,
  FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'rejected';
  required: boolean;
  icon: JSX.Element;
}

export default function StudentVerificationPage() {
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [profileStatus, setProfileStatus] = useState<'incomplete' | 'pending' | 'verified'>('incomplete');
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadVerificationData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          const steps: VerificationStep[] = [
            {
              id: "personal-info",
              title: "Personal Information",
              description: "Complete your basic personal details",
              status: profileData.first_name && profileData.last_name && profileData.phone ? 'completed' : 'pending',
              required: true,
              icon: <UserCheck className="w-5 h-5" />
            },
            {
              id: "academic-info",
              title: "Academic Information",
              description: "Provide your academic details like level and department",
              status: profileData.level && profileData.department && profileData.matric_number ? 'completed' : 'pending',
              required: true,
              icon: <GraduationCap className="w-5 h-5" />
            },
            {
              id: "documents",
              title: "Supporting Documents",
              description: "Upload required documents for verification",
              status: profileData.document_status === 'verified' ? 'completed' : 
                      profileData.document_status === 'rejected' ? 'rejected' : 'pending',
              required: true,
              icon: <FileText className="w-5 h-5" />
            },
            {
              id: "identity",
              title: "Identity Verification",
              description: "Have your identity verified by authorities",
              status: profileData.identity_verified ? 'completed' : 'pending',
              required: true,
              icon: <Shield className="w-5 h-5" />
            }
          ];

          setVerificationSteps(steps);

          // Calculate profile status
          const completedSteps = steps.filter(step => step.status === 'completed').length;
          const progress = Math.round((completedSteps / steps.length) * 100);
          setOverallProgress(progress);

          if (progress === 100) {
            setProfileStatus('verified');
          } else if (steps.some(step => step.status === 'pending' || step.status === 'rejected')) {
            setProfileStatus('pending');
          } else {
            setProfileStatus('incomplete');
          }
        }
      } catch (error) {
        console.error("Error loading verification data:", error);
        toast.error("Failed to load verification data");
      } finally {
        setLoading(false);
      }
    }

    loadVerificationData();
  }, [supabase]);

  const handleContinue = (stepId: string) => {
    toast.success(`Continuing with ${stepId} verification`);
  };

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.length;

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
        <h1 className="text-3xl font-bold">Profile Verification</h1>
        <p className="text-muted-foreground">Complete the verification process for your bio-data.</p>
      </div>

      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {profileStatus === 'verified' ? 'Verified' : profileStatus === 'pending' ? 'In Progress' : 'Not Started'}
              </span>
              <Badge variant={profileStatus === 'verified' ? 'default' : profileStatus === 'pending' ? 'secondary' : 'outline'}>
                {completedSteps}/{totalSteps} Steps
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {overallProgress}% of verification process completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <div className="grid gap-6 md:grid-cols-2">
        {verificationSteps.map((step) => (
          <Card key={step.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' : 
                  step.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : step.status === 'rejected' ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <Clock className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {step.title}
                    {!step.required && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={
                  step.status === 'completed' ? 'default' : 
                  step.status === 'rejected' ? 'destructive' : 
                  'secondary'
                }>
                  {step.status === 'completed' ? 'Completed' : 
                   step.status === 'rejected' ? 'Rejected' : 'Pending'}
                </Badge>
                <Button 
                  variant={step.status === 'completed' ? 'secondary' : 'default'} 
                  size="sm"
                  onClick={() => handleContinue(step.id)}
                >
                  {step.status === 'completed' ? 'View Details' : 
                   step.status === 'rejected' ? 'Re-submit' : 'Complete Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-medium">What you need to get verified:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Complete personal information (name, phone number, email)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Academic details (level, department, matric number)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Valid identification document</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Academic transcripts or certificates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Passport photograph</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Important Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Verification by university authorities is required for your profile to be considered complete. 
                    This process ensures the accuracy of your bio-data for academic records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}