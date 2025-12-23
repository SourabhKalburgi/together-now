import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Utensils, Loader2 } from 'lucide-react';

const CreateRequest = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    restaurant_name: '',
    location: '',
    date_time: '',
    cuisine_type: '',
    diet_type: 'any',
    budget: 'moderate',
    max_participants: '4',
    description: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from('dining_requests').insert({
        creator_id: user.id,
        restaurant_name: formData.restaurant_name,
        location: formData.location,
        date_time: new Date(formData.date_time).toISOString(),
        cuisine_type: formData.cuisine_type || null,
        diet_type: formData.diet_type,
        budget: formData.budget,
        max_participants: parseInt(formData.max_participants),
        description: formData.description || null,
        status: 'open', // ensure new requests are surfaced on the browse page
      });

      if (error) throw error;

      toast({
        title: "Request created!",
        description: "Your dining request has been posted.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error creating request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  // Get minimum datetime (now + 1 hour)
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Button>

        {/* Form Card */}
        <Card className="border-0 shadow-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Create Dining Request</CardTitle>
                <CardDescription>Find companions to dine with</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Restaurant & Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                  <Input
                    id="restaurant_name"
                    placeholder="e.g., The Italian Kitchen"
                    value={formData.restaurant_name}
                    onChange={(e) => handleChange('restaurant_name', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Downtown, Main Street"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              {/* Date & Cuisine */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_time">Date & Time *</Label>
                  <Input
                    id="date_time"
                    type="datetime-local"
                    value={formData.date_time}
                    min={minDateTime}
                    onChange={(e) => handleChange('date_time', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine_type">Cuisine Type</Label>
                  <Input
                    id="cuisine_type"
                    placeholder="e.g., Italian, Chinese, Indian"
                    value={formData.cuisine_type}
                    onChange={(e) => handleChange('cuisine_type', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Diet Preference</Label>
                  <Select value={formData.diet_type} onValueChange={(v) => handleChange('diet_type', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Select value={formData.budget} onValueChange={(v) => handleChange('budget', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget ($)</SelectItem>
                      <SelectItem value="moderate">Moderate ($$)</SelectItem>
                      <SelectItem value="premium">Premium ($$$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_participants">Max People</Label>
                  <Select value={formData.max_participants} onValueChange={(v) => handleChange('max_participants', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 people</SelectItem>
                      <SelectItem value="3">3 people</SelectItem>
                      <SelectItem value="4">4 people</SelectItem>
                      <SelectItem value="5">5 people</SelectItem>
                      <SelectItem value="6">6 people</SelectItem>
                      <SelectItem value="8">8 people</SelectItem>
                      <SelectItem value="10">10 people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add any details about the meal, what you're looking for in dining companions, etc."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="gradient"
                className="w-full h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateRequest;
