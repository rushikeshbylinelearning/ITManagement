import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';

// Icons for sidebar
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const drawerWidth = 240;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [inventoryOpen, setInventoryOpen] = useState(false);

  const user = JSON.parse(sessionStorage.getItem('user'));
  const userRole = user ? user.role : null;

  // ✅ CHANGED: This effect now handles both opening AND closing the menu
  // It synchronizes the dropdown's state with the current URL path.
  useEffect(() => {
    const isActive = location.pathname.startsWith('/inventory') || location.pathname.startsWith('/robotics-inventory');
    setInventoryOpen(isActive);
  }, [location.pathname]); // The effect re-runs every time the path changes

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const allMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'technician', 'employee'] },
    { 
      text: 'Inventory', 
      icon: <InventoryIcon />, 
      roles: ['admin', 'technician'],
      subItems: [
        { text: 'IT Inventory', icon: <ComputerIcon />, path: '/inventory', roles: ['admin', 'technician'] },
        { text: 'Robotics Inventory', icon: <SmartToyIcon />, path: '/robotics-inventory', roles: ['admin', 'technician'] },
      ]
    },
    { text: 'Allocations', icon: <ComputerIcon />, path: '/allocations', roles: ['admin', 'technician'] },
    { text: 'Users', icon: <GroupIcon />, path: '/users', roles: ['admin'] },
    { text: 'Tickets', icon: <ConfirmationNumberIcon />, path: '/tickets', roles: ['admin', 'technician', 'employee'] },
    { text: 'Inquiries', icon: <HelpOutlineIcon />, path: '/inquiries', roles: ['admin'] },
    { text: 'HR', icon: <GroupIcon />, path: '/hr', roles: ['admin', 'technician'] },
  ];

  const visibleMenuItems = allMenuItems.filter(item => userRole && item.roles.includes(userRole));
  
  // This click handler is now primarily for manual toggling when not on an inventory page.
  const handleInventoryToggle = () => {
      setInventoryOpen(!inventoryOpen);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar (No changes here) */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'background.paper',
          color: 'text.primary'
        }}
        elevation={1}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
            IT Management Portal
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 1 }}>
          <List>
            {visibleMenuItems.map((item) => {
              // If the item has sub-items, render a collapsible menu
              if (item.subItems) {
                return (
                  <React.Fragment key={item.text}>
                    <ListItemButton onClick={handleInventoryToggle} sx={{ borderRadius: 1, mb: 0.5 }}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                      {inventoryOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.filter(sub => sub.roles.includes(userRole)).map((subItem) => ( // Also filter sub-items by role
                          <ListItemButton
                            key={subItem.text}
                            onClick={() => navigate(subItem.path)}
                            selected={location.pathname === subItem.path}
                            sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
                          >
                            <ListItemIcon>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  </React.Fragment>
                );
              }
              
              // Otherwise, render a normal menu item
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    // Use strict equality for Allocations to avoid conflict with Inventory path
                    selected={item.path === '/allocations' ? location.pathname === item.path : location.pathname.startsWith(item.path)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content (No changes here) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;