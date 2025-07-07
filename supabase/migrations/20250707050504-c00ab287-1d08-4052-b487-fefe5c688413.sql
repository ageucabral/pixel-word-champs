-- Atualizar as configurações de pontuação para os valores corretos (Opção A: 1, 2, 3, 6)
UPDATE game_settings 
SET setting_value = '1'
WHERE setting_key = 'points_per_3_to_5_letter_word' AND category = 'scoring';

UPDATE game_settings 
SET setting_value = '2'
WHERE setting_key = 'points_per_6_to_8_letter_word' AND category = 'scoring';

UPDATE game_settings 
SET setting_value = '3'
WHERE setting_key = 'points_per_8_to_10_letter_word' AND category = 'scoring';

UPDATE game_settings 
SET setting_value = '6'
WHERE setting_key = 'points_per_11_to_20_letter_word' AND category = 'scoring';

-- Inserir configurações caso não existam
INSERT INTO game_settings (setting_key, setting_value, category, setting_type, description)
VALUES 
  ('points_per_3_to_5_letter_word', '1', 'scoring', 'integer', 'Pontos para palavras de 3-5 letras'),
  ('points_per_6_to_8_letter_word', '2', 'scoring', 'integer', 'Pontos para palavras de 6-8 letras'),
  ('points_per_8_to_10_letter_word', '3', 'scoring', 'integer', 'Pontos para palavras de 9-10 letras'),
  ('points_per_11_to_20_letter_word', '6', 'scoring', 'integer', 'Pontos para palavras de 11+ letras')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Log da atualização
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  settings_snapshot,
  affected_users
) VALUES (
  'scoring_system_unification',
  now(),
  now(),
  'completed',
  jsonb_build_object(
    'action', 'updated_scoring_values',
    'old_values', jsonb_build_object(
      'points_per_3_to_5_letter_word', '30',
      'points_per_6_to_8_letter_word', '60',
      'points_per_8_to_10_letter_word', '100',
      'points_per_11_to_20_letter_word', '150'
    ),
    'new_values', jsonb_build_object(
      'points_per_3_to_5_letter_word', '1',
      'points_per_6_to_8_letter_word', '2',
      'points_per_8_to_10_letter_word', '3',
      'points_per_11_to_20_letter_word', '6'
    ),
    'reason', 'Unificação do sistema de pontuação - Opção A escolhida',
    'timestamp', now()
  ),
  0
);