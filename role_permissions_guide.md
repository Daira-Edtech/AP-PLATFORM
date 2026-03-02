# Role Permissions: Integration & Implementation Guide

This guide explains how to integrate the dynamic role-based permission system managed in the Admin Panel into your **React Native** mobile application and other platform services.

---

## 🏗️ Architecture Overview

1.  **Storage**: Permissions are stored as a JSON configuration in the `system_settings` table under the key `role_permissions`.
2.  **Management**: The Admin Dashboard (`/admin/roles`) provides a UI to update this JSON.
3.  **Consumption**: All client applications (Web, Mobile, External APIs) fetch this JSON to determine feature accessibility.

---

## 📱 React Native Implementation

The best way to handle this in React Native is using a **Context Provider** to fetch the permissions once and make them available throughout the app.

### 1. Create the Permissions Context

```typescript
// src/context/PermissionsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type PermissionLevel = 'ALLOWED' | 'DENIED' | 'READ_ONLY';

interface PermissionsContextType {
  hasAccess: (featureId: string) => PermissionLevel;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // 1. Get current user's role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || 'aww');
      }

      // 2. Fetch global permissions config
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'role_permissions')
        .single();

      if (data?.setting_value) {
        setPermissions(data.setting_value);
      }
      setLoading(false);
    }
    init();
  }, []);

  const hasAccess = (featureId: string): PermissionLevel => {
    if (!permissions || !userRole) return 'DENIED';

    // Search through all groups and find the matching feature ID
    for (const group of permissions) {
      const feature = group.features.find((f: any) => f.id === featureId);
      if (feature) {
        return feature.roles[userRole] || 'DENIED';
      }
    }
    return 'DENIED';
  };

  return (
    <PermissionsContext.Provider value={{ hasAccess, loading }}>
        {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) throw new Error('usePermissions must be used within a PermissionsProvider');
  return context;
};
```

### 2. Guarding Your UI Components

Use the `hasAccess` helper to conditionally render buttons, screens, or features.

```tsx
// src/screens/ChildrenDirectory.tsx
import { usePermissions } from '../context/PermissionsContext';

const ChildrenDirectory = () => {
  const { hasAccess, loading } = usePermissions();

  if (loading) return <LoadingSpinner />;

  // Access level for registering a child
  const registerAccess = hasAccess('reg_child');

  return (
    <View>
      <FlatList ... />

      {/* RENDER GUARD: Only show Add button if user is ALLOWED */}
      {registerAccess === 'ALLOWED' && (
        <FAB
          icon="plus"
          onPress={() => navigation.navigate('AddChild')}
          label="Register New Child"
        />
      )}

      {/* READ ONLY FEEDBACK: If allowed to view but not edit */}
      {registerAccess === 'READ_ONLY' && (
        <Banner>You are in View-Only mode for this district.</Banner>
      )}
    </View>
  );
};
```

---

## 🔒 Backend Security (Supabase RLS)

UI guarding is for user experience, but **Real Security** happens at the database level. You can use a Supabase function to check these permissions in your RLS policies.

### Helper Function for Policies

```sql
CREATE OR REPLACE FUNCTION check_permission(p_feature_id TEXT, p_required_level TEXT DEFAULT 'ALLOWED')
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_permissions JSONB;
BEGIN
    -- 1. Get the current user's role
    SELECT (role)::TEXT INTO v_user_role FROM profiles WHERE id = auth.uid();

    -- 2. Get the global config
    SELECT setting_value INTO v_permissions FROM system_settings WHERE setting_key = 'role_permissions';

    -- 3. Check if the role's permission for feature_id matches required level
    -- Note: This requires the JSON to be traversed.
    -- Better practice: Cache this in a materialized view if performance is critical for high-volume tables.
    RETURN (
        SELECT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(v_permissions) AS groups,
                 jsonb_array_elements(groups->'features') AS feature
            WHERE feature->>'id' = p_feature_id
              AND (feature->'roles'->>v_user_role) = p_required_level
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Applying the Policy

```sql
-- Secure the 'children' table registration
CREATE POLICY "Role Based Insert" ON public.children
FOR INSERT TO authenticated
WITH CHECK (
    check_permission('reg_child', 'ALLOWED')
);
```

---

## ⚡ Deployment Checklist

1. [ ] **Default Values**: Ensure the `system_settings` table has a default `role_permissions` row so the app doesn't crash on first load.
2. [ ] **Caching**: In React Native, consider caching these permissions in `AsyncStorage` and refreshing them in the background to ensure the app works offline.
3. [ ] **Admin Audit**: All changes to these permissions should be logged in the `audit_log` table (enabled automatically by the `updateRolePermissions` action).
4. [ ] **Role Synchronization**: Ensure role IDs in `profiles.role` match the IDs in the `ROLES` constant in `RolePermissions.tsx` (e.g., lowercase 'aww', 'supervisor', etc.).

---

**Generated by Antigravity AI | March 2026**
