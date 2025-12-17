import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Leaf, Drumstick, DollarSign, Loader2, Save } from 'lucide-react';

interface Profile {
  full_name: string | null;
  diet_preference: string;
  budget_preference: string;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    diet_preference: 'any',
    budget_preference: 'moderate',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, diet_preference, budget_preference')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          diet_preference: data.diet_preference || 'any',
          budget_preference: data.budget_preference || 'moderate',
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          diet_preference: profile.diet_preference,
          budget_preference: profile.budget_preference,
        });

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
          <p className="text-muted-foreground">Manage your account and dining preferences</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-card animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="Your name"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card className="border-0 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>Dining Preferences</CardTitle>
                <CardDescription>Set your default preferences for dining requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diet Preference */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-primary" />
                    Diet Preference
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'veg', label: 'Vegetarian', icon: Leaf },
                      { value: 'non-veg', label: 'Non-Veg', icon: Drumstick },
                      { value: 'any', label: 'Any', icon: null },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, diet_preference: option.value })}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          profile.diet_preference === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option.icon && (
                          <option.icon className={`w-5 h-5 mx-auto mb-2 ${
                            profile.diet_preference === option.value ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        )}
                        <span className={`text-sm font-medium ${
                          profile.diet_preference === option.value ? 'text-primary' : 'text-foreground'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Preference */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Budget Preference
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'budget', label: 'Budget', symbol: '$' },
                      { value: 'moderate', label: 'Moderate', symbol: '$$' },
                      { value: 'premium', label: 'Premium', symbol: '$$$' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, budget_preference: option.value })}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          profile.budget_preference === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className={`text-lg font-bold ${
                          profile.budget_preference === option.value ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {option.symbol}
                        </span>
                        <span className={`block text-sm font-medium mt-1 ${
                          profile.budget_preference === option.value ? 'text-primary' : 'text-foreground'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              variant="gradient"
              className="w-full h-12"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
