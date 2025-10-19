# Update AuthContext After Implementing Triggers

Once you run `FIX_FOREIGN_KEY_ERROR.sql` and set up the database trigger, you should update `contexts/AuthContext.tsx` to remove the manual insert logic.

## Changes to Make:

### In `signUpWithEmail` function:

**BEFORE (Current):**
```typescript
const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign up error:', error);
      return { error };
    }
    
    // Create user record
    if (data.user) {
      console.log('Creating user record for:', data.user.email);
      
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        is_anonymous: false,
      });
      
      // ... more manual insert code ...
    }
    
    return { error: null };
  } catch (error) {
    console.error('Email sign up error:', error);
    return { error };
  }
};
```

**AFTER (With Triggers):**
```typescript
const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign up error:', error);
      return { error };
    }
    
    // Database trigger automatically creates user record and stats!
    if (data.user) {
      console.log('✅ User created:', data.user.email);
      console.log('Database trigger will create user record automatically');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Email sign up error:', error);
    return { error };
  }
};
```

## Benefits of Using Triggers:

1. ✅ **No timing issues** - Trigger runs at database level
2. ✅ **No foreign key errors** - Trigger has proper permissions
3. ✅ **Cleaner code** - Less manual insert logic
4. ✅ **More reliable** - Can't forget to create user records
5. ✅ **Atomic operation** - All or nothing

## When to Update:

⚠️ **Only update AuthContext AFTER** you've successfully run the SQL trigger script and verified it works!

## Testing:

1. Run `FIX_FOREIGN_KEY_ERROR.sql` in Supabase
2. Try registering WITHOUT updating AuthContext (trigger should work anyway)
3. Check if user appears in tables
4. Then optionally clean up the AuthContext code

