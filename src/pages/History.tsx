import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import DiningRequestCard from '@/components/DiningRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Utensils, Loader2 } from 'lucide-react';

interface DiningRequest {
  id: string;
  restaurant_name: string;
  location: string;
  date_time: string;
  cuisine_type: string | null;
  diet_type: string;
  budget: string;
  max_participants: number;
  description: string | null;
  creator_id: string;
  status: string;
  profiles: { full_name: string | null } | null;
}

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [myRequests, setMyRequests] = useState<DiningRequest[]>([]);
  const [joinedRequests, setJoinedRequests] = useState<DiningRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      // Fetch user's own requests
      const { data: myData, error: myError } = await supabase
        .from('dining_requests')
        .select('*')
        .eq('creator_id', user.id)
        .order('date_time', { ascending: false });

      if (myError) throw myError;

      // Get profiles for my requests
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .maybeSingle();

      const myRequestsWithProfile = myData?.map(r => ({
        ...r,
        profiles: myProfile
      })) || [];

      // Fetch requests the user has joined
      const { data: participantData, error: participantError } = await supabase
        .from('dining_participants')
        .select('request_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const joinedIds = participantData?.map(p => p.request_id) || [];

      if (joinedIds.length > 0) {
        const { data: joinedData, error: joinedError } = await supabase
          .from('dining_requests')
          .select('*')
          .in('id', joinedIds)
          .neq('creator_id', user.id)
          .order('date_time', { ascending: false });

        if (joinedError) throw joinedError;

        // Get profiles for joined requests
        const creatorIds = [...new Set(joinedData?.map(r => r.creator_id) || [])];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', creatorIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const joinedWithProfiles = joinedData?.map(r => ({
          ...r,
          profiles: profilesMap.get(r.creator_id) || null
        })) || [];

        setJoinedRequests(joinedWithProfiles);
      }

      setMyRequests(myRequestsWithProfile);
    } catch (error: any) {
      toast({
        title: "Error loading history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 space-y-3">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary">
        <Clock className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your History</h1>
          <p className="text-muted-foreground">View your past and upcoming dining events</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="created" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="created" className="flex-1 sm:flex-none">
                My Requests ({myRequests.length})
              </TabsTrigger>
              <TabsTrigger value="joined" className="flex-1 sm:flex-none">
                Joined ({joinedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="created" className="mt-6">
              {myRequests.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myRequests.map((request) => (
                    <DiningRequestCard
                      key={request.id}
                      request={request}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="You haven't created any dining requests yet" />
              )}
            </TabsContent>

            <TabsContent value="joined" className="mt-6">
              {joinedRequests.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {joinedRequests.map((request) => (
                    <DiningRequestCard
                      key={request.id}
                      request={request}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="You haven't joined any dining requests yet" />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default History;
