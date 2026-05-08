import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlignLogo } from '@/components/AlignLogo';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner-native';

type Mode = 'signin' | 'signup';
type Role = 'manager' | 'worker';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<Role>('manager');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return toast.error('Email and password are required');
    setLoading(true);
    const res = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password, fullName.trim() || email.split('@')[0], role);
    setLoading(false);
    if (res.error) toast.error(res.error.message);
    else if (mode === 'signup') toast.success('Check your email to verify your account');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          <View className="items-center mb-10">
            <AlignLogo size={56} />
            <Text className="font-display text-[34px] text-foreground mt-4" style={{ letterSpacing: -1 }}>Align</Text>
            <Text className="text-muted-foreground text-sm mt-1">Schedules that bring teams together</Text>
          </View>

          <View className="bg-card rounded-3xl p-6 border border-border gap-4">
            <View className="flex-row gap-2 p-1 bg-secondary rounded-xl">
              {(['signin', 'signup'] as const).map(m => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className={`flex-1 h-9 items-center justify-center rounded-lg ${mode === m ? 'bg-card' : ''}`}
                >
                  <Text className={`text-sm font-sans-semibold ${mode === m ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {m === 'signin' ? 'Sign in' : 'Create account'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'signup' && (
              <>
                <Input label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                <View className="gap-1.5">
                  <Text className="text-foreground text-sm font-sans-medium">I'm joining as</Text>
                  <View className="flex-row gap-2">
                    {(['manager', 'worker'] as const).map(r => (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        className={`flex-1 h-11 rounded-xl items-center justify-center border ${role === r ? 'border-primary bg-accent' : 'border-border bg-card'}`}
                      >
                        <Text className={`text-sm font-sans-semibold capitalize ${role === r ? 'text-accent-foreground' : 'text-foreground'}`}>{r}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <Button onPress={submit} loading={loading} className="mt-2">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
