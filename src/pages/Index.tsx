import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import DiningRequestCard from '@/components/DiningRequestCard';
import OfflineBanner from '@/components/OfflineBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Search, Filter, Plus, Utensils, Loader2 } from 'lucide-react';
import { MESSAGES } from '@/lib/constants/messages';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-handler';
import { checkOfflineAndNotify } from '@/lib/utils/offline-handler';

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

interface Participant {
  request_id: string;
  user_id: string;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  
  const [requests, setRequests] = useState<DiningRequest[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinedRequests, setJoinedRequests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dietFilter, setDietFilter] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isOnline) {
      fetchRequests();
    } else if (!isOnline) {
      setLoading(false);
    }
  }, [user, isOnline]);

  const fetchRequests = async () => {
    setLoading(true);

    try {
      // Fetch open requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('dining_requests')
        .select('*')
        .eq('status', 'open')
        .order('date_time', { ascending: true });

      if (requestsError) throw requestsError;

      // Fetch creator profiles
      const creatorIds = [...new Set(requestsData?.map(r => r.creator_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const requestsWithProfiles = requestsData?.map(r => ({
        ...r,
        profiles: profilesMap.get(r.creator_id) || null
      })) || [];

      // Fetch all participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('dining_participants')
        .select('request_id, user_id');

      if (participantsError) throw participantsError;

      setRequests(requestsWithProfiles);
      setParticipants(participantsData || []);

      // Set joined requests for current user
      const userJoined = new Set(
        participantsData
          ?.filter(p => p.user_id === user?.id)
          .map(p => p.request_id) || []
      );
      setJoinedRequests(userJoined);
    } catch (error: any) {
      toast({
        title: getErrorTitle('LOADING_REQUESTS'),
        description: getErrorMessage(error, 'LOADING_REQUESTS'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (requestId: string) => {
    if (!user) return;
    if (checkOfflineAndNotify(isOnline, toast, {
      title: MESSAGES.OFFLINE.TITLE,
      description: MESSAGES.OFFLINE.JOIN_DESCRIPTION,
    })) {
      return;
    }
    setActionLoading(requestId);

    try {
      const { error } = await supabase
        .from('dining_participants')
        .insert({ request_id: requestId, user_id: user.id });

      if (error) throw error;

      setJoinedRequests(prev => new Set([...prev, requestId]));
      setParticipants(prev => [...prev, { request_id: requestId, user_id: user.id }]);
      
      toast({
        title: MESSAGES.SUCCESS.JOINED_REQUEST.TITLE,
        description: MESSAGES.SUCCESS.JOINED_REQUEST.DESCRIPTION,
      });
    } catch (error: any) {
      toast({
        title: getErrorTitle('JOINING_REQUEST'),
        description: getErrorMessage(error, 'JOINING_REQUEST'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (requestId: string) => {
    if (!user) return;
    if (checkOfflineAndNotify(isOnline, toast, {
      title: MESSAGES.OFFLINE.TITLE,
      description: MESSAGES.OFFLINE.LEAVE_DESCRIPTION,
    })) {
      return;
    }
    setActionLoading(requestId);

    try {
      const { error } = await supabase
        .from('dining_participants')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', user.id);

      if (error) throw error;

      setJoinedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      setParticipants(prev => prev.filter(p => !(p.request_id === requestId && p.user_id === user.id)));
      
      toast({
        title: MESSAGES.SUCCESS.LEFT_REQUEST.TITLE,
        description: MESSAGES.SUCCESS.LEFT_REQUEST.DESCRIPTION,
      });
    } catch (error: any) {
      toast({
        title: getErrorTitle('LEAVING_REQUEST'),
        description: getErrorMessage(error, 'LEAVING_REQUEST'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getParticipantCount = (requestId: string) => {
    return participants.filter(p => p.request_id === requestId).length;
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (request.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesDiet = dietFilter === 'all' || request.diet_type === dietFilter;
    const matchesBudget = budgetFilter === 'all' || request.budget === budgetFilter;
    
    return matchesSearch && matchesDiet && matchesBudget;
  });

  const myRequests = filteredRequests.filter(r => r.creator_id === user.id);
  const otherRequests = filteredRequests.filter(r => r.creator_id !== user.id);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find Dining Companions</h1>
            <p className="text-muted-foreground">Join open requests or create your own</p>
          </div>
          <Button variant="gradient" onClick={() => navigate('/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>

        <OfflineBanner isOnline={isOnline} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <div className="flex gap-3">
            <Select value={dietFilter} onValueChange={setDietFilter}>
              <SelectTrigger className="w-32 h-11">
                <SelectValue placeholder="Diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All diets</SelectItem>
                <SelectItem value="veg">Veg</SelectItem>
                <SelectItem value="non-veg">Non-veg</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="w-32 h-11">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All budgets</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My requests</h2>
                <Button variant="gradient" onClick={() => navigate('/create')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Request
                </Button>
              </div>

              {myRequests.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {myRequests.map((request) => (
                    <DiningRequestCard
                      key={request.id}
                      request={{
                        ...request,
                        participant_count: getParticipantCount(request.id),
                      }}
                      currentUserId={user.id}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      isJoined={joinedRequests.has(request.id)}
                      isLoading={actionLoading === request.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 rounded-xl border border-dashed text-muted-foreground">
                  You haven’t created any upcoming requests yet.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Other requests</h2>
              {otherRequests.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {otherRequests.map((request) => (
                    <DiningRequestCard
                      key={request.id}
                      request={{
                        ...request,
                        participant_count: getParticipantCount(request.id),
                      }}
                      currentUserId={user.id}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      isJoined={joinedRequests.has(request.id)}
                      isLoading={actionLoading === request.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 rounded-xl border border-dashed text-muted-foreground">
                  No open requests from others right now.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Index;
