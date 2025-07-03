
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/hooks/useAuth';
import { LoginForm as LoginFormType } from '@/types';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import ForgotPasswordModal from './ForgotPasswordModal';

import { loginSchema } from '@/utils/validation';
import { processInput } from '@/utils/emailPhoneDetection';
import { Phone } from 'lucide-react';

const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem('loginRememberMe');
    return saved ? JSON.parse(saved) : false;
  });
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false
    }
  });

  const [inputType, setInputType] = useState<'email' | 'phone' | 'unknown'>('unknown');

  // Efeito para salvar preferência no localStorage
  useEffect(() => {
    localStorage.setItem('loginRememberMe', JSON.stringify(rememberMe));
  }, [rememberMe]);

  const onSubmit = async (data: LoginFormType) => {
    try {
      logger.info('Tentativa de login iniciada', { emailOrPhone: data.emailOrPhone, rememberMe }, 'LOGIN_FORM');
      await login({ 
        emailOrPhone: data.emailOrPhone, 
        password: data.password, 
        rememberMe 
      });
      
      logger.info('Login realizado, redirecionando para home', undefined, 'LOGIN_FORM');
      navigate('/');
    } catch (err: any) {
      logger.error('Erro no login', { error: err.message }, 'LOGIN_FORM');
    }
  };

  // Função para lidar com mudanças no campo email/telefone
  const handleEmailPhoneChange = (value: string) => {
    const result = processInput(value);
    setInputType(result.type);
    return result.value;
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="emailOrPhone"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <label className="text-gray-700 font-medium text-sm">
                Email ou Telefone
                {inputType !== 'unknown' && (
                  <span className="ml-2 text-xs text-purple-600">
                    ({inputType === 'email' ? 'Email' : 'Telefone'})
                  </span>
                )}
              </label>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="seu@email.com ou (11) 99999-9999" 
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-800 pl-12"
                    {...field}
                    onChange={(e) => {
                      const formatted = handleEmailPhoneChange(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                  {inputType === 'phone' ? (
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  ) : (
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <label className="text-gray-700 font-medium text-sm">Senha</label>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-800 pl-12 pr-12"
                    {...field}
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label 
              htmlFor="rememberMe" 
              className="text-gray-600 cursor-pointer select-none"
            >
              Manter-me conectado
            </label>
          </div>
          <button
            type="button"
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-purple-600 font-medium cursor-pointer hover:text-purple-700 transition-colors"
          >
            Esqueci a senha
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-3 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Entrar na Batalha
            </>
          )}
        </Button>
      </form>
      
      <ForgotPasswordModal 
        open={showForgotPasswordModal}
        onOpenChange={setShowForgotPasswordModal}
      />
    </Form>
  );
};

export default LoginForm;
