import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  Shield, 
  Users, 
  Search, 
  Edit3, 
  Save, 
  X,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/employees`);
        if (response.ok) {
          const data = await response.json();
          setAllEmployees(data);
        } else {
          toast({ title: "Error", description: "Failed to fetch employees.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "An error occurred while fetching employees.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [toast]);

  const filteredEmployees = allEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePasswordReset = (employee) => {
    setSelectedUser(employee);
    setShowPasswordReset(true);
    setNewPassword('Welcome@123');
  };

  const handleSavePassword = () => {
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Mock password reset
    toast({
      title: "Password Reset",
      description: `Password for ${selectedUser.Name} has been reset successfully.`,
    });
    
    setShowPasswordReset(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const handleEditUser = (employee) => {
    setEditingUser({
      ...employee,
      originalEmail: employee["Email ID"]
    });
  };

  const handleSaveUser = () => {
    // Mock user update
    toast({
      title: "User Updated",
      description: `User ${editingUser.Name} has been updated successfully.`,
    });
    setEditingUser(null);
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have administrator privileges to access this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-[#225F8B]" />
          Admin Panel
        </h2>
        <Badge variant="outline" className="bg-[#225F8B]/10 text-[#225F8B] border-[#225F8B]/20">
          {filteredEmployees.length} Users
        </Badge>
      </div>

      {/* Search */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees by name, email, or department..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.map((employee, index) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#225F8B] text-white">
                      {employee.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{employee.name}</div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                    <div className="text-xs text-gray-500">
                      {employee.designation} • {employee.department}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(employee)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePasswordReset(employee)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Reset Password
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <Card className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordReset(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-[#225F8B] text-white text-xs">
                      {selectedUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{selectedUser?.name}</div>
                    <div className="text-xs text-gray-500">{selectedUser?.email}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePassword}
                  className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Card className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="editName"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editEmail" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editDesignation" className="text-sm font-medium">
                  Designation
                </Label>
                <Input
                  id="editDesignation"
                  value={editingUser.designation}
                  onChange={(e) => setEditingUser({...editingUser, designation: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUser}
                  className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminPanel;