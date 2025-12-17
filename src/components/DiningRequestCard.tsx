import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, DollarSign, Leaf, Drumstick } from 'lucide-react';

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
  profiles?: { full_name: string | null } | null;
  participant_count?: number;
}

interface DiningRequestCardProps {
  request: DiningRequest;
  currentUserId?: string;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  isJoined?: boolean;
  isLoading?: boolean;
}

const DiningRequestCard = ({ 
  request, 
  currentUserId, 
  onJoin, 
  onLeave, 
  isJoined,
  isLoading 
}: DiningRequestCardProps) => {
  const isCreator = currentUserId === request.creator_id;
  const participantCount = request.participant_count || 0;
  const spotsLeft = request.max_participants - participantCount;

  const getBudgetIcon = (budget: string) => {
    const count = budget === 'budget' ? 1 : budget === 'moderate' ? 2 : 3;
    return Array(count).fill('$').join('');
  };

  const getDietIcon = (diet: string) => {
    if (diet === 'veg') return <Leaf className="w-3 h-3" />;
    if (diet === 'non-veg') return <Drumstick className="w-3 h-3" />;
    return null;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in group">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                {request.restaurant_name}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{request.location}</span>
              </div>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {request.cuisine_type || 'Various'}
            </Badge>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{format(new Date(request.date_time), 'MMM d, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{spotsLeft} spots left</span>
            </div>
            <div className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-full">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span>{getBudgetIcon(request.budget)}</span>
            </div>
            {request.diet_type !== 'any' && (
              <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-full capitalize">
                {getDietIcon(request.diet_type)}
                <span>{request.diet_type}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {request.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              by {request.profiles?.full_name || 'Anonymous'}
            </span>
            {!isCreator && (
              isJoined ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onLeave?.(request.id)}
                  disabled={isLoading}
                >
                  Leave
                </Button>
              ) : (
                <Button 
                  variant="gradient" 
                  size="sm"
                  onClick={() => onJoin?.(request.id)}
                  disabled={isLoading || spotsLeft <= 0}
                >
                  {spotsLeft <= 0 ? 'Full' : 'Join'}
                </Button>
              )
            )}
            {isCreator && (
              <Badge className="bg-primary/10 text-primary border-0">Your request</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiningRequestCard;
