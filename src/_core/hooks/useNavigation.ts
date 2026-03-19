import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { useLocation } from "wouter";
import {
  menuItems,
  adminMenuItems,
  ceoMenuItems,
  deptHeadMenuItems,
  hrMenuItems,
  financeMenuItems,
  MenuItem
} from "@/components/layout/nav-config";

export function useNavigation() {
  const { user, hasRole } = useAuth();
  const [location, setLocation] = useLocation();

  const getMenuItems = useCallback((): MenuItem[] => {
    if (!user) return menuItems;

    let combined: MenuItem[] = [];
    if (hasRole('admin')) combined = [...combined, ...adminMenuItems];
    if (hasRole('ceo_md')) combined = [...combined, ...ceoMenuItems];
    if (hasRole('head_of_department')) combined = [...combined, ...deptHeadMenuItems];
    if (hasRole('hr')) combined = [...combined, ...hrMenuItems];
    if (hasRole('head_of_finance')) combined = [...combined, ...financeMenuItems];

    if (combined.length === 0) {
      combined = [...menuItems];
    }

    const seenLabels = new Set();
    return combined.filter(item => {
      if (seenLabels.has(item.label)) return false;
      seenLabels.add(item.label);
      return true;
    });
  }, [user, hasRole]);

  const allMenus = getMenuItems();
  const currentPath = location.split('?')[0];

  const activeMenuItem = allMenus.find(item => {
    if (item.path === currentPath) return true;
    if (item.submenu) {
      return item.submenu.some(sub => sub.path === currentPath);
    }
    return false;
  });

  return {
    menuItems: allMenus,
    activeMenuItem,
    location,
    setLocation,
  };
}
