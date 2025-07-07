
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Globe, Volume2, Shield, User, Smartphone, Palette, Moon } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import LanguageSelectionScreen from './LanguageSelectionScreen';
import DeleteAccountScreen from './DeleteAccountScreen';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import TermsOfServiceScreen from './TermsOfServiceScreen';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'settings' | 'language' | 'delete' | 'privacy' | 'terms'>('settings');

  if (currentScreen === 'language') {
    return <LanguageSelectionScreen onBack={() => setCurrentScreen('settings')} />;
  }

  if (currentScreen === 'delete') {
    return <DeleteAccountScreen onBack={() => setCurrentScreen('settings')} />;
  }

  if (currentScreen === 'privacy') {
    return <PrivacyPolicyScreen onBack={() => setCurrentScreen('settings')} />;
  }

  if (currentScreen === 'terms') {
    return <TermsOfServiceScreen onBack={() => setCurrentScreen('settings')} />;
  }

  const settingsGroups = [
    {
      title: "Notificações",
      icon: Bell,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      settings: [
        {
          label: "Novos desafios",
          description: "Receba avisos sobre novos jogos",
          value: notifications,
          onChange: setNotifications
        }
      ]
    },
    {
      title: "Experiência",
      icon: Palette,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      settings: [
        {
          label: "Sons do jogo",
          description: "Efeitos sonoros durante partidas",
          value: sounds,
          onChange: setSounds
        },
        {
          label: "Vibração",
          description: "Feedback tátil ao jogar",
          value: vibration,
          onChange: setVibration
        },
        {
          label: "Modo escuro",
          description: "Interface com tema escuro",
          value: darkMode,
          onChange: setDarkMode
        }
      ]
    }
  ];

  const actionGroups = [
    {
      title: "Sistema",
      icon: Globe,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      actions: [
        {
          label: "Idioma",
          description: "Português (Brasil)",
          action: () => setCurrentScreen('language')
        }
      ]
    },
    {
      title: "Privacidade",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      actions: [
        {
          label: "Política de Privacidade",
          description: "Como protegemos seus dados",
          action: () => setCurrentScreen('privacy')
        },
        {
          label: "Termos de Uso",
          description: "Regras e condições do app",
          action: () => setCurrentScreen('terms')
        },
        {
          label: "Excluir conta",
          description: "Remover permanentemente",
          action: () => setCurrentScreen('delete'),
          danger: true
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Configurações</h1>
            <p className="text-sm text-gray-600">Personalize sua experiência</p>
          </div>
        </div>

        {/* Grupos de configurações com switches */}
        {settingsGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className={`w-8 h-8 ${group.bgColor} rounded-lg flex items-center justify-center`}>
                  <group.icon className={`w-4 h-4 ${group.color}`} />
                </div>
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {group.settings.map((setting, settingIndex) => (
                <div key={settingIndex} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <Switch 
                    checked={setting.value} 
                    onCheckedChange={setting.onChange}
                    className="shrink-0"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Grupos de ações */}
        {actionGroups.map((group, groupIndex) => (
          <Card key={groupIndex} className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className={`w-8 h-8 ${group.bgColor} rounded-lg flex items-center justify-center`}>
                  <group.icon className={`w-4 h-4 ${group.color}`} />
                </div>
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              {group.actions.map((action, actionIndex) => (
                <button
                  key={actionIndex}
                  onClick={action.action}
                  className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                    action.danger ? 'hover:bg-red-50' : ''
                  }`}
                >
                  <div>
                    <p className={`font-medium ${action.danger ? 'text-red-600' : 'text-gray-900'}`}>
                      {action.label}
                    </p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Informações do app */}
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Caça Palavras Royale v1.0.0</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Feito com ❤️ para gamers brasileiros</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
