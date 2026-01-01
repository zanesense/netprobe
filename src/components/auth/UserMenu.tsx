// User menu component for authenticated users
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  LogOut,
  Shield,
  Database,
  FileText,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSavedScans } from '@/hooks/useSavedScans';
import { ProfileModal } from './ProfileModal';

export function UserMenu() {
  const { user, userProfile, logout } = useAuth();
  const { savedScans } = useSavedScans();
  const [showProfile, setShowProfile] = useState(false);

  if (!user || !userProfile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    return <Badge variant="secondary" className="text-xs">Free</Badge>;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(userProfile.displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(userProfile.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {userProfile.displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                    {userProfile.email}
                  </p>
                  <div className="mt-2">
                    {getRoleBadge(userProfile.role)}
                  </div>
                </div>
              </div>
              
              {/* Usage Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {userProfile.usage.scansPerformed}
                  </div>
                  <div className="text-xs text-muted-foreground">Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {Math.round(userProfile.usage.totalScanTime / 1000 / 60)}m
                  </div>
                  <div className="text-xs text-muted-foreground">Total Time</div>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowProfile(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Database className="mr-2 h-4 w-4" />
            <span>Saved Scans</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {savedScans.length}
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            <span>Reports</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </>
  );
}